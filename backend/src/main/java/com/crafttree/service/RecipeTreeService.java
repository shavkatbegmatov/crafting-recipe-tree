package com.crafttree.service;

import com.crafttree.dto.RawTotalDto;
import com.crafttree.dto.RecipeTreeNodeDto;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.GameVersion;
import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeTreeService {

    private static final int MAX_DEPTH = 20;
    private static final String RAW_CATEGORY = "RAW";

    private final CraftItemRepository craftItemRepository;
    private final RecipeRepository recipeRepository;
    private final GameVersionService gameVersionService;

    /**
     * Build the recipe tree for the given item, scoped to a specific game version
     * (or current version if {@code version} is null/blank).
     */
    @Cacheable(value = "recipeTrees", key = "#itemId + ':' + #version")
    public RecipeTreeNodeDto getRecipeTree(Long itemId, String version) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        return buildTreeNode(item, gv, BigDecimal.ONE, new HashSet<>(), 0);
    }

    @Cacheable(value = "rawTotals", key = "#itemId + ':' + #version")
    public RawTotalDto getRawTotals(Long itemId, String version) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        GameVersion gv = gameVersionService.resolveOrCurrent(version);

        Map<Long, BigDecimal> rawMap = new LinkedHashMap<>();
        Map<Long, CraftItem> itemLookup = new HashMap<>();
        calculateRawTotals(item, gv, BigDecimal.ONE, rawMap, itemLookup, new HashSet<>(), 0);

        List<RawTotalDto.RawMaterialEntry> materials = rawMap.entrySet().stream()
                .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed())
                .map(e -> {
                    CraftItem raw = itemLookup.get(e.getKey());
                    return RawTotalDto.RawMaterialEntry.builder()
                            .id(raw.getId())
                            .name(raw.getName())
                            .nameUz(raw.getNameUz())
                            .nameEn(raw.getNameEn())
                            .nameUzCyr(raw.getNameUzCyr())
                            .categoryCode(raw.getCategory().getCode())
                            .imageUrl(raw.getImageUrl())
                            .totalQuantity(e.getValue().setScale(4, RoundingMode.HALF_UP))
                            .build();
                })
                .collect(Collectors.toList());

        int totalTime = calculateTotalCraftTime(item, gv, BigDecimal.ONE, new HashSet<>(), 0);

        return RawTotalDto.builder()
                .itemId(item.getId())
                .itemName(item.getName())
                .itemNameUz(item.getNameUz())
                .itemNameEn(item.getNameEn())
                .itemNameUzCyr(item.getNameUzCyr())
                .totalCraftTimeSeconds(totalTime)
                .rawMaterials(materials)
                .build();
    }

    @Cacheable(value = "craftTimes", key = "#itemId + ':' + #version")
    public int getTotalCraftTime(Long itemId, String version) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        return calculateTotalCraftTime(item, gv, BigDecimal.ONE, new HashSet<>(), 0);
    }

    // -------------------------------------------------------------------------
    // Internal recursion helpers
    // -------------------------------------------------------------------------

    private RecipeTreeNodeDto buildTreeNode(CraftItem item, GameVersion gv, BigDecimal quantity,
                                            Set<Long> visited, int depth) {
        Optional<Recipe> recipeOpt = depth > MAX_DEPTH || RAW_CATEGORY.equals(item.getCategory().getCode())
                ? Optional.empty()
                : recipeRepository.findByResultItemIdAndGameVersionId(item.getId(), gv.getId());

        Integer craftTime = recipeOpt.map(Recipe::getCraftTimeSeconds).orElse(item.getCraftTimeSeconds());

        RecipeTreeNodeDto node = RecipeTreeNodeDto.builder()
                .id(item.getId())
                .name(item.getName())
                .nameUz(item.getNameUz())
                .nameEn(item.getNameEn())
                .nameUzCyr(item.getNameUzCyr())
                .category(item.getCategory().getCode())
                .craftTimeSeconds(craftTime)
                .imageUrl(item.getImageUrl())
                .quantity(quantity)
                .children(new ArrayList<>())
                .build();

        if (depth > MAX_DEPTH || recipeOpt.isEmpty() || visited.contains(item.getId())) {
            return node;
        }

        visited.add(item.getId());

        for (RecipeIngredient ri : recipeOpt.get().getIngredients()) {
            RecipeTreeNodeDto child = buildTreeNode(
                    ri.getIngredientItem(),
                    gv,
                    ri.getQuantity(),
                    new HashSet<>(visited),
                    depth + 1
            );
            node.getChildren().add(child);
        }

        return node;
    }

    private void calculateRawTotals(CraftItem item, GameVersion gv, BigDecimal multiplier,
                                    Map<Long, BigDecimal> rawMap, Map<Long, CraftItem> itemLookup,
                                    Set<Long> visited, int depth) {
        if (depth > MAX_DEPTH || visited.contains(item.getId())) {
            return;
        }

        if (RAW_CATEGORY.equals(item.getCategory().getCode())) {
            rawMap.merge(item.getId(), multiplier, BigDecimal::add);
            itemLookup.putIfAbsent(item.getId(), item);
            return;
        }

        visited.add(item.getId());

        Optional<Recipe> recipeOpt = recipeRepository.findByResultItemIdAndGameVersionId(item.getId(), gv.getId());
        if (recipeOpt.isEmpty() || recipeOpt.get().getIngredients().isEmpty()) {
            // No recipe in this version → treat as a leaf raw-ish material so it shows up in totals.
            rawMap.merge(item.getId(), multiplier, BigDecimal::add);
            itemLookup.putIfAbsent(item.getId(), item);
            return;
        }

        for (RecipeIngredient ri : recipeOpt.get().getIngredients()) {
            BigDecimal childQuantity = ri.getQuantity().multiply(multiplier);
            calculateRawTotals(ri.getIngredientItem(), gv, childQuantity, rawMap, itemLookup,
                    new HashSet<>(visited), depth + 1);
        }
    }

    private int calculateTotalCraftTime(CraftItem item, GameVersion gv, BigDecimal quantity,
                                        Set<Long> visited, int depth) {
        if (depth > MAX_DEPTH || visited.contains(item.getId())) {
            return 0;
        }
        if (RAW_CATEGORY.equals(item.getCategory().getCode())) {
            return 0;
        }

        visited.add(item.getId());

        Optional<Recipe> recipeOpt = recipeRepository.findByResultItemIdAndGameVersionId(item.getId(), gv.getId());
        Integer ownTimeSeconds = recipeOpt.map(Recipe::getCraftTimeSeconds).orElse(item.getCraftTimeSeconds());

        int ownTime = ownTimeSeconds != null
                ? BigDecimal.valueOf(ownTimeSeconds).multiply(quantity).intValue()
                : 0;

        if (recipeOpt.isEmpty()) {
            return ownTime;
        }

        int childrenTime = 0;
        for (RecipeIngredient ri : recipeOpt.get().getIngredients()) {
            BigDecimal childQty = ri.getQuantity().multiply(quantity);
            childrenTime += calculateTotalCraftTime(ri.getIngredientItem(), gv, childQty,
                    new HashSet<>(visited), depth + 1);
        }
        return ownTime + childrenTime;
    }
}
