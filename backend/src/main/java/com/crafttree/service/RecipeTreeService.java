package com.crafttree.service;

import com.crafttree.dto.RawTotalDto;
import com.crafttree.dto.RecipeTreeNodeDto;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeIngredientRepository;
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
    private final RecipeIngredientRepository recipeIngredientRepository;

    @Cacheable(value = "recipeTrees", key = "#itemId")
    public RecipeTreeNodeDto getRecipeTree(Long itemId) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        return buildTreeNode(item, BigDecimal.ONE, new HashSet<>(), 0);
    }

    @Cacheable(value = "rawTotals", key = "#itemId")
    public RawTotalDto getRawTotals(Long itemId) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));

        Map<Long, BigDecimal> rawMap = new LinkedHashMap<>();
        Map<Long, CraftItem> itemLookup = new HashMap<>();
        calculateRawTotals(item, BigDecimal.ONE, rawMap, itemLookup, new HashSet<>(), 0);

        List<RawTotalDto.RawMaterialEntry> materials = rawMap.entrySet().stream()
                .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed())
                .map(e -> {
                    CraftItem raw = itemLookup.get(e.getKey());
                    return RawTotalDto.RawMaterialEntry.builder()
                            .name(raw.getName())
                            .nameUz(raw.getNameUz())
                            .nameEn(raw.getNameEn())
                            .nameUzCyr(raw.getNameUzCyr())
                            .totalQuantity(e.getValue().setScale(4, RoundingMode.HALF_UP))
                            .build();
                })
                .collect(Collectors.toList());

        int totalTime = calculateTotalCraftTime(item, BigDecimal.ONE, new HashSet<>(), 0);

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

    @Cacheable(value = "craftTimes", key = "#itemId")
    public int getTotalCraftTime(Long itemId) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        return calculateTotalCraftTime(item, BigDecimal.ONE, new HashSet<>(), 0);
    }

    private RecipeTreeNodeDto buildTreeNode(CraftItem item, BigDecimal quantity, Set<Long> visited, int depth) {
        if (depth > MAX_DEPTH) {
            return RecipeTreeNodeDto.builder()
                    .id(item.getId())
                    .name(item.getName())
                    .nameUz(item.getNameUz())
                    .nameEn(item.getNameEn())
                    .nameUzCyr(item.getNameUzCyr())
                    .category(item.getCategory().getCode())
                    .craftTimeSeconds(item.getCraftTimeSeconds())
                    .quantity(quantity)
                    .children(Collections.emptyList())
                    .build();
        }

        RecipeTreeNodeDto node = RecipeTreeNodeDto.builder()
                .id(item.getId())
                .name(item.getName())
                .nameUz(item.getNameUz())
                .nameEn(item.getNameEn())
                .nameUzCyr(item.getNameUzCyr())
                .category(item.getCategory().getCode())
                .craftTimeSeconds(item.getCraftTimeSeconds())
                .quantity(quantity)
                .children(new ArrayList<>())
                .build();

        if (RAW_CATEGORY.equals(item.getCategory().getCode()) || visited.contains(item.getId())) {
            return node;
        }

        visited.add(item.getId());

        List<RecipeIngredient> ingredients = recipeIngredientRepository.findByResultItemId(item.getId());
        for (RecipeIngredient ri : ingredients) {
            RecipeTreeNodeDto child = buildTreeNode(
                    ri.getIngredientItem(),
                    ri.getQuantity(),
                    new HashSet<>(visited),
                    depth + 1
            );
            node.getChildren().add(child);
        }

        return node;
    }

    private void calculateRawTotals(CraftItem item, BigDecimal multiplier, Map<Long, BigDecimal> rawMap, Map<Long, CraftItem> itemLookup, Set<Long> visited, int depth) {
        if (depth > MAX_DEPTH || visited.contains(item.getId())) {
            return;
        }

        if (RAW_CATEGORY.equals(item.getCategory().getCode())) {
            rawMap.merge(item.getId(), multiplier, BigDecimal::add);
            itemLookup.putIfAbsent(item.getId(), item);
            return;
        }

        visited.add(item.getId());

        List<RecipeIngredient> ingredients = recipeIngredientRepository.findByResultItemId(item.getId());
        if (ingredients.isEmpty()) {
            rawMap.merge(item.getId(), multiplier, BigDecimal::add);
            itemLookup.putIfAbsent(item.getId(), item);
            return;
        }

        for (RecipeIngredient ri : ingredients) {
            BigDecimal childQuantity = ri.getQuantity().multiply(multiplier);
            calculateRawTotals(ri.getIngredientItem(), childQuantity, rawMap, itemLookup, new HashSet<>(visited), depth + 1);
        }
    }

    private int calculateTotalCraftTime(CraftItem item, BigDecimal quantity, Set<Long> visited, int depth) {
        if (depth > MAX_DEPTH || visited.contains(item.getId())) {
            return 0;
        }

        if (RAW_CATEGORY.equals(item.getCategory().getCode())) {
            return 0;
        }

        visited.add(item.getId());

        int ownTime = item.getCraftTimeSeconds() != null
                ? BigDecimal.valueOf(item.getCraftTimeSeconds()).multiply(quantity).intValue()
                : 0;

        List<RecipeIngredient> ingredients = recipeIngredientRepository.findByResultItemId(item.getId());
        int childrenTime = 0;
        for (RecipeIngredient ri : ingredients) {
            BigDecimal childQty = ri.getQuantity().multiply(quantity);
            childrenTime += calculateTotalCraftTime(ri.getIngredientItem(), childQty, new HashSet<>(visited), depth + 1);
        }

        return ownTime + childrenTime;
    }
}
