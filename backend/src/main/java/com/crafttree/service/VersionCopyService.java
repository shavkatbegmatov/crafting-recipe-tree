package com.crafttree.service;

import com.crafttree.dto.VersionCopyResultDto;
import com.crafttree.entity.AuditAction;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.GameVersion;
import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeIngredientRepository;
import com.crafttree.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Itemlarni (va ularning retseptlarini) bir o'yin versiyasidan boshqasiga nusxalaydi.
 * <p>
 * Yangi versiya bo'sh boshlanadi — bu servis uni to'ldirishning yagona yo'li.
 * Nusxa olish <b>idempotent</b>: maqsad versiyada allaqachon bor item yoki retsept
 * qayta yaratilmaydi, shuning uchun amalni takrorlash zarar qilmaydi.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class VersionCopyService {

    private final CraftItemRepository craftItemRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final GameVersionService gameVersionService;
    private final AuditService auditService;

    /**
     * @param sourceVersionId manba versiya
     * @param targetVersionId maqsad versiya
     * @param itemIds         nusxalanadigan itemlar; {@code null} yoki bo'sh bo'lsa — manbaning HAMMASI
     * @param withRecipes     retseptlar ham ko'chirilsinmi (shunda ingredient itemlar avtomatik qo'shiladi)
     */
    @Transactional
    public VersionCopyResultDto copy(Long sourceVersionId, Long targetVersionId,
                                     List<Long> itemIds, boolean withRecipes) {
        if (sourceVersionId.equals(targetVersionId)) {
            throw new IllegalArgumentException("Manba va maqsad versiya bir xil bo'lishi mumkin emas");
        }
        GameVersion source = gameVersionService.findById(sourceVersionId);
        GameVersion target = gameVersionService.findById(targetVersionId);

        List<String> warnings = new ArrayList<>();
        List<CraftItem> roots = resolveRoots(source, itemIds, warnings);

        // Retseptlar ko'chirilsa, ingredient itemlarsiz ular yaroqsiz bo'ladi —
        // shuning uchun bog'liqliklarni tranzitiv qo'shamiz.
        List<CraftItem> toCopy = withRecipes ? expandIngredients(roots, source) : roots;

        // srcItemId -> maqsad versiyadagi item (yangi yaratilgan yoki allaqachon mavjud)
        Map<Long, CraftItem> mapped = new HashMap<>();
        int copied = 0;
        int skipped = 0;

        for (CraftItem src : toCopy) {
            Optional<CraftItem> existing =
                    craftItemRepository.findByItemKeyAndGameVersionId(src.getItemKey(), target.getId());
            if (existing.isPresent()) {
                mapped.put(src.getId(), existing.get());
                skipped++;
                continue;
            }
            mapped.put(src.getId(), craftItemRepository.save(copyItem(src, target)));
            copied++;
        }

        int recipesCopied = 0;
        int recipesSkipped = 0;
        if (withRecipes) {
            for (CraftItem src : toCopy) {
                Optional<Recipe> srcRecipe = recipeRepository
                        .findByResultItemIdAndGameVersionId(src.getId(), source.getId());
                if (srcRecipe.isEmpty()) {
                    continue;
                }
                CraftItem targetItem = mapped.get(src.getId());
                if (recipeRepository.findByResultItemIdAndGameVersionId(
                        targetItem.getId(), target.getId()).isPresent()) {
                    recipesSkipped++;
                    continue;
                }
                if (copyRecipe(srcRecipe.get(), targetItem, target, mapped, warnings)) {
                    recipesCopied++;
                } else {
                    recipesSkipped++;
                }
            }
        }

        log.info("Nusxa olindi {} -> {}: {} item, {} retsept (o'tkazib yuborilgan: {} item, {} retsept)",
                source.getVersion(), target.getVersion(), copied, recipesCopied, skipped, recipesSkipped);
        auditService.log(AuditAction.VERSION_COPY, "GAME_VERSION", target.getId(),
                source.getVersion() + " -> " + target.getVersion() + ": "
                        + copied + " item, " + recipesCopied + " retsept");

        return VersionCopyResultDto.builder()
                .sourceVersion(source.getVersion())
                .targetVersion(target.getVersion())
                .itemsCopied(copied)
                .itemsSkipped(skipped)
                .recipesCopied(recipesCopied)
                .recipesSkipped(recipesSkipped)
                .warnings(warnings)
                .build();
    }

    private List<CraftItem> resolveRoots(GameVersion source, List<Long> itemIds, List<String> warnings) {
        if (itemIds == null || itemIds.isEmpty()) {
            return craftItemRepository.findAllByGameVersionId(source.getId());
        }
        List<CraftItem> roots = new ArrayList<>();
        for (CraftItem it : craftItemRepository.findAllById(itemIds)) {
            if (it.getGameVersion().getId().equals(source.getId())) {
                roots.add(it);
            } else {
                warnings.add("Item #" + it.getId() + " (" + it.getName() + ") manba versiyaga tegishli emas — o'tkazib yuborildi");
            }
        }
        return roots;
    }

    /** Tanlangan itemlar retseptlarida ishlatiladigan barcha itemlarni tranzitiv qo'shadi. */
    private List<CraftItem> expandIngredients(List<CraftItem> roots, GameVersion source) {
        Map<Long, CraftItem> result = new HashMap<>();
        Set<Long> visited = new HashSet<>();
        Deque<CraftItem> queue = new ArrayDeque<>(roots);
        roots.forEach(r -> result.put(r.getId(), r));

        while (!queue.isEmpty()) {
            CraftItem current = queue.poll();
            if (!visited.add(current.getId())) {
                continue;
            }
            recipeRepository.findByResultItemIdAndGameVersionId(current.getId(), source.getId())
                    .ifPresent(recipe -> {
                        for (RecipeIngredient ri : recipe.getIngredients()) {
                            CraftItem ingredient = ri.getIngredientItem();
                            if (result.putIfAbsent(ingredient.getId(), ingredient) == null) {
                                queue.add(ingredient);
                            }
                        }
                    });
        }
        return new ArrayList<>(result.values());
    }

    private CraftItem copyItem(CraftItem src, GameVersion target) {
        return CraftItem.builder()
                .name(src.getName())
                .nameUz(src.getNameUz())
                .nameEn(src.getNameEn())
                .nameUzCyr(src.getNameUzCyr())
                .description(src.getDescription())
                .descriptionUz(src.getDescriptionUz())
                .descriptionEn(src.getDescriptionEn())
                .descriptionUzCyr(src.getDescriptionUzCyr())
                .category(src.getCategory())
                .craftTimeSeconds(src.getCraftTimeSeconds())
                .imageUrl(src.getImageUrl())
                .tags(new HashSet<>(src.getTags()))
                // Versiyalararo bog'lovchi — ataylab o'zgarishsiz ko'chiriladi.
                .itemKey(src.getItemKey())
                .gameVersion(target)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    /** @return retsept ko'chirildimi (ingredienti yetishmasa {@code false}) */
    private boolean copyRecipe(Recipe src, CraftItem targetItem, GameVersion target,
                               Map<Long, CraftItem> mapped, List<String> warnings) {
        // Avval hamma ingredient maqsad versiyada borligiga ishonch hosil qilamiz —
        // yarim ko'chirilgan retsept qoldirmaslik uchun.
        for (RecipeIngredient ri : src.getIngredients()) {
            if (!mapped.containsKey(ri.getIngredientItem().getId())) {
                warnings.add("'" + targetItem.getName() + "' retsepti o'tkazib yuborildi: ingredient '"
                        + ri.getIngredientItem().getName() + "' maqsad versiyada yo'q");
                return false;
            }
        }

        Recipe copy = recipeRepository.save(Recipe.builder()
                .resultItem(targetItem)
                .gameVersion(target)
                .craftTimeSeconds(src.getCraftTimeSeconds())
                .notes(src.getNotes())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build());

        for (RecipeIngredient ri : src.getIngredients()) {
            recipeIngredientRepository.save(RecipeIngredient.builder()
                    .recipe(copy)
                    .ingredientItem(mapped.get(ri.getIngredientItem().getId()))
                    .gameVersion(target)
                    .quantity(ri.getQuantity())
                    .build());
        }
        return true;
    }
}
