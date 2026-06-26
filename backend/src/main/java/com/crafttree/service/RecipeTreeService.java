package com.crafttree.service;

import com.crafttree.dto.CraftPlanDto;
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
        int[] timeAcc = {0};
        calculateRawTotals(item, gv, BigDecimal.ONE, rawMap, itemLookup, new HashSet<>(), 0, timeAcc);

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

        // Vaqt yuqoridagi yagona o'tishda yig'ildi — avval daraxt ikkinchi marta aylanardi (2x DB so'rov).
        int totalTime = timeAcc[0];

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

    /**
     * Kraft rejasi: oraliq itemlarni dependency tartibida (chuqurroq avval) qadamlarga ajratadi,
     * xomashyoni inventardan ayirib "sotib olish kerak" ro'yxatini, hamda ketma-ket va parallel
     * (kritik yo'l) jami vaqtni hisoblaydi.
     */
    public CraftPlanDto generateCraftPlan(Long itemId, int targetQuantity, String version,
                                          Map<Long, BigDecimal> inventory) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        int qty = Math.max(1, targetQuantity);
        BigDecimal target = BigDecimal.valueOf(qty);
        Map<Long, BigDecimal> inv = inventory != null ? inventory : Map.of();

        Map<Long, PlanNode> intermediate = new HashMap<>();
        Map<Long, BigDecimal> rawMap = new LinkedHashMap<>();
        Map<Long, CraftItem> rawLookup = new HashMap<>();
        collectPlan(item, gv, target, 0, intermediate, rawMap, rawLookup, new HashSet<>());

        // Qadamlar — oraliq itemlar, maxDepth bo'yicha kamayish tartibida (chuqurroq = avval yasaladi).
        List<PlanNode> ordered = new ArrayList<>(intermediate.values());
        ordered.sort(Comparator.comparingInt((PlanNode p) -> p.maxDepth).reversed());
        List<CraftPlanDto.CraftStep> steps = new ArrayList<>();
        int seqTime = 0;
        int stepNum = 1;
        for (PlanNode p : ordered) {
            int t = p.ownTime != null
                    ? BigDecimal.valueOf(p.ownTime).multiply(p.totalQty).setScale(0, RoundingMode.HALF_UP).intValue()
                    : 0;
            seqTime += t;
            steps.add(CraftPlanDto.CraftStep.from(p.item, stepNum++,
                    p.totalQty.setScale(4, RoundingMode.HALF_UP), t));
        }

        // Sotib olish ro'yxati: xomashyo jami - inventarda bor (kamida 0).
        List<CraftPlanDto.ShoppingEntry> shopping = rawMap.entrySet().stream()
                .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed())
                .map(e -> {
                    CraftItem raw = rawLookup.get(e.getKey());
                    BigDecimal needed = e.getValue();
                    BigDecimal have = inv.getOrDefault(e.getKey(), BigDecimal.ZERO);
                    BigDecimal toProcure = needed.subtract(have).max(BigDecimal.ZERO);
                    return CraftPlanDto.ShoppingEntry.from(raw,
                            needed.setScale(4, RoundingMode.HALF_UP),
                            have.setScale(4, RoundingMode.HALF_UP),
                            toProcure.setScale(4, RoundingMode.HALF_UP));
                })
                .collect(Collectors.toList());

        int parallel = criticalPath(item, gv, target, new HashSet<>(), 0);

        return CraftPlanDto.builder()
                .targetItemId(item.getId())
                .targetItemName(item.getName())
                .targetItemNameUz(item.getNameUz())
                .targetItemNameEn(item.getNameEn())
                .targetItemNameUzCyr(item.getNameUzCyr())
                .targetQuantity(qty)
                .steps(steps)
                .shoppingList(shopping)
                .totalTimeSeconds(seqTime)
                .parallelTimeSeconds(parallel)
                .build();
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

    /**
     * Xomashyo jami VA kraft vaqtini bir o'tishda hisoblaydi. Vaqt {@code timeAcc[0]} ga yig'iladi
     * (avval xomashyo va vaqt uchun daraxt ikki marta alohida aylanardi — 2x DB so'rov).
     */
    private void calculateRawTotals(CraftItem item, GameVersion gv, BigDecimal multiplier,
                                    Map<Long, BigDecimal> rawMap, Map<Long, CraftItem> itemLookup,
                                    Set<Long> visited, int depth, int[] timeAcc) {
        if (depth > MAX_DEPTH || visited.contains(item.getId())) {
            return;
        }

        if (RAW_CATEGORY.equals(item.getCategory().getCode())) {
            rawMap.merge(item.getId(), multiplier, BigDecimal::add);
            itemLookup.putIfAbsent(item.getId(), item);
            return; // xomashyo — kraft vaqti yo'q
        }

        visited.add(item.getId());

        Optional<Recipe> recipeOpt = recipeRepository.findByResultItemIdAndGameVersionId(item.getId(), gv.getId());

        // Bu tugunning o'z kraft vaqti (retsept vaqti, bo'lmasa item vaqti) * multiplier.
        Integer ownTimeSeconds = recipeOpt.map(Recipe::getCraftTimeSeconds).orElse(item.getCraftTimeSeconds());
        if (ownTimeSeconds != null) {
            timeAcc[0] += BigDecimal.valueOf(ownTimeSeconds).multiply(multiplier).intValue();
        }

        if (recipeOpt.isEmpty() || recipeOpt.get().getIngredients().isEmpty()) {
            // No recipe in this version → treat as a leaf raw-ish material so it shows up in totals.
            rawMap.merge(item.getId(), multiplier, BigDecimal::add);
            itemLookup.putIfAbsent(item.getId(), item);
            return;
        }

        for (RecipeIngredient ri : recipeOpt.get().getIngredients()) {
            BigDecimal childQuantity = ri.getQuantity().multiply(multiplier);
            calculateRawTotals(ri.getIngredientItem(), gv, childQuantity, rawMap, itemLookup,
                    new HashSet<>(visited), depth + 1, timeAcc);
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

    /** Rejani yig'adi: oraliq itemlar (yasash qadami) va xomashyo (sotib olish ro'yxati). */
    private void collectPlan(CraftItem item, GameVersion gv, BigDecimal multiplier, int depth,
                             Map<Long, PlanNode> intermediate, Map<Long, BigDecimal> rawMap,
                             Map<Long, CraftItem> rawLookup, Set<Long> visited) {
        if (depth > MAX_DEPTH || visited.contains(item.getId())) {
            return;
        }
        if (RAW_CATEGORY.equals(item.getCategory().getCode())) {
            rawMap.merge(item.getId(), multiplier, BigDecimal::add);
            rawLookup.putIfAbsent(item.getId(), item);
            return;
        }

        visited.add(item.getId());
        Optional<Recipe> recipeOpt = recipeRepository.findByResultItemIdAndGameVersionId(item.getId(), gv.getId());

        if (recipeOpt.isEmpty() || recipeOpt.get().getIngredients().isEmpty()) {
            // Retsepti yo'q — xomashyodek ko'rinadi (sotib olish ro'yxatiga tushadi).
            rawMap.merge(item.getId(), multiplier, BigDecimal::add);
            rawLookup.putIfAbsent(item.getId(), item);
            return;
        }

        Recipe recipe = recipeOpt.get();
        PlanNode node = intermediate.computeIfAbsent(item.getId(), k -> new PlanNode(item));
        node.totalQty = node.totalQty.add(multiplier);
        node.maxDepth = Math.max(node.maxDepth, depth);
        node.ownTime = recipe.getCraftTimeSeconds() != null
                ? recipe.getCraftTimeSeconds() : item.getCraftTimeSeconds();

        for (RecipeIngredient ri : recipe.getIngredients()) {
            BigDecimal childQty = ri.getQuantity().multiply(multiplier);
            collectPlan(ri.getIngredientItem(), gv, childQty, depth + 1,
                    intermediate, rawMap, rawLookup, new HashSet<>(visited));
        }
    }

    /** Parallel (kritik yo'l) vaqt: tugun o'z vaqti + eng uzun bola zanjiri. */
    private int criticalPath(CraftItem item, GameVersion gv, BigDecimal quantity, Set<Long> visited, int depth) {
        if (depth > MAX_DEPTH || visited.contains(item.getId())
                || RAW_CATEGORY.equals(item.getCategory().getCode())) {
            return 0;
        }
        visited.add(item.getId());
        Optional<Recipe> recipeOpt = recipeRepository.findByResultItemIdAndGameVersionId(item.getId(), gv.getId());
        Integer ownTimeSeconds = recipeOpt.map(Recipe::getCraftTimeSeconds).orElse(item.getCraftTimeSeconds());
        int ownTime = ownTimeSeconds != null
                ? BigDecimal.valueOf(ownTimeSeconds).multiply(quantity).setScale(0, RoundingMode.HALF_UP).intValue()
                : 0;
        if (recipeOpt.isEmpty()) {
            return ownTime;
        }
        int maxChild = 0;
        for (RecipeIngredient ri : recipeOpt.get().getIngredients()) {
            BigDecimal childQty = ri.getQuantity().multiply(quantity);
            maxChild = Math.max(maxChild, criticalPath(ri.getIngredientItem(), gv, childQty,
                    new HashSet<>(visited), depth + 1));
        }
        return ownTime + maxChild;
    }

    /** Reja yig'ish uchun ichki yordamchi: oraliq itemning jami miqdori, eng chuqur darajasi, vaqti. */
    private static final class PlanNode {
        final CraftItem item;
        BigDecimal totalQty = BigDecimal.ZERO;
        int maxDepth = 0;
        Integer ownTime;

        PlanNode(CraftItem item) {
            this.item = item;
        }
    }
}
