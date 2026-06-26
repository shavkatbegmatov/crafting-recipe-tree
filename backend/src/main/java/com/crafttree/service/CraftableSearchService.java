package com.crafttree.service;

import com.crafttree.dto.CraftableItemDto;
import com.crafttree.dto.CraftableItemDto.MissingMaterial;
import com.crafttree.dto.CraftableSearchRequest.MaterialEntry;
import com.crafttree.entity.GameVersion;
import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * "Nima yasay olaman?" — foydalanuvchi materiallaridan bevosita (bir qadamlik retsept bilan)
 * yasash mumkin bo'lgan itemlarni topadi.
 * <p>
 * Berilgan versiyadagi barcha retseptlar bir marta (JOIN FETCH bilan) yuklanadi va xotirada
 * solishtiriladi. Har bir retsept chiqishi 1 dona deb hisoblanadi (domendagi qoida).
 */
@Service
@RequiredArgsConstructor
public class CraftableSearchService {

    private final RecipeRepository recipeRepository;
    private final GameVersionService gameVersionService;

    @Transactional(readOnly = true)
    public List<CraftableItemDto> search(List<MaterialEntry> materials, String version) {
        // Foydalanuvchi materiallari: itemId → jami miqdor (takror kiritilsa qo'shiladi).
        Map<Long, BigDecimal> have = new HashMap<>();
        if (materials != null) {
            for (MaterialEntry m : materials) {
                if (m.itemId() != null && m.quantity() != null && m.quantity().signum() > 0) {
                    have.merge(m.itemId(), m.quantity(), BigDecimal::add);
                }
            }
        }
        if (have.isEmpty()) {
            return List.of();
        }

        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        List<Recipe> recipes = recipeRepository.findAllWithIngredientsByGameVersionId(gv.getId());

        List<CraftableItemDto> result = new ArrayList<>();
        for (Recipe recipe : recipes) {
            List<RecipeIngredient> ingredients = recipe.getIngredients();
            if (ingredients == null || ingredients.isEmpty()) {
                continue;
            }

            boolean relevant = false;           // foydalanuvchi materiallaridan kamida bittasi ishlatiladi
            BigDecimal maxCraftable = null;      // min(have/required) bo'yicha
            BigDecimal completenessSum = BigDecimal.ZERO; // har ingredient bo'yicha min(have/required, 1) yig'indisi
            List<MissingMaterial> missing = new ArrayList<>();

            for (RecipeIngredient ri : ingredients) {
                BigDecimal required = ri.getQuantity();
                BigDecimal userHas = have.getOrDefault(ri.getIngredientItem().getId(), BigDecimal.ZERO);

                if (userHas.signum() > 0) {
                    relevant = true;
                }
                // Bu ingredientdan nechta to'plam chiqadi (butun songa pastga yaxlitlanadi).
                BigDecimal possible = (required != null && required.signum() > 0)
                        ? userHas.divide(required, 0, RoundingMode.FLOOR)
                        : BigDecimal.ZERO;
                maxCraftable = (maxCraftable == null) ? possible : maxCraftable.min(possible);

                // Tayyorlik ulushi: have/required (1 dan oshmaydi); required yo'q/0 bo'lsa — to'liq.
                BigDecimal ratio = (required != null && required.signum() > 0)
                        ? userHas.divide(required, 4, RoundingMode.HALF_UP).min(BigDecimal.ONE)
                        : BigDecimal.ONE;
                completenessSum = completenessSum.add(ratio);

                if (required != null && userHas.compareTo(required) < 0) {
                    missing.add(MissingMaterial.from(ri.getIngredientItem(), required, userHas));
                }
            }

            // Faqat foydalanuvchi materiallariga aloqador retseptlarni qaytaramiz.
            if (relevant) {
                int max = (maxCraftable != null) ? maxCraftable.intValue() : 0;
                int total = ingredients.size();
                double completeness = total > 0
                        ? completenessSum.divide(BigDecimal.valueOf(total), 4, RoundingMode.HALF_UP).doubleValue()
                        : 0.0;
                result.add(CraftableItemDto.from(recipe.getResultItem(), max, max >= 1, completeness, total, missing));
            }
        }

        // Avval to'liq yasaladiganlar, keyin ko'proq yasaladiganlar, keyin tayyorligi yuqori
        // (eng yaqin), oxirida kamroq yetishmaydiganlar.
        result.sort(Comparator
                .comparing(CraftableItemDto::fullyCraftable).reversed()
                .thenComparing(Comparator.comparingInt(CraftableItemDto::maxCraftable).reversed())
                .thenComparing(Comparator.comparingDouble(CraftableItemDto::completeness).reversed())
                .thenComparingInt(CraftableItemDto::missingCount));
        return result;
    }
}
