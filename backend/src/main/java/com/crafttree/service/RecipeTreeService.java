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
     * Kraft rejasi — <b>inventarni hisobga oladi</b>: qo'lda tayyor oraliq itemlar qadamlardan
     * tushib qoladi va ularning xomashyosi "sotib olish kerak" ro'yxatiga qo'shilmaydi.
     * Qadamlar dependency tartibida (chuqurroq avval), vaqt esa ketma-ket va parallel
     * (kritik yo'l) ko'rinishida beriladi — ikkalasi ham faqat qolgan ish bo'yicha.
     */
    public CraftPlanDto generateCraftPlan(Long itemId, int targetQuantity, String version,
                                          Map<Long, BigDecimal> inventory) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        int qty = Math.max(1, targetQuantity);
        Map<Long, BigDecimal> inv = inventory != null ? inventory : Map.of();

        CraftResolution res = resolveCraft(item, gv, BigDecimal.valueOf(qty), inv);

        // Qadamlar — faqat yasalishi kerak bo'lganlar, maxDepth bo'yicha kamayish tartibida
        // (chuqurroq = avval yasaladi). Inventarda tayyor bo'lganlari bu ro'yxatda umuman yo'q.
        List<ResolvedStep> ordered = new ArrayList<>(res.toCraft.values());
        ordered.sort(Comparator.comparingInt((ResolvedStep s) -> s.maxDepth).reversed());
        List<CraftPlanDto.CraftStep> steps = new ArrayList<>();
        int seqTime = 0;
        int stepNum = 1;
        for (ResolvedStep s : ordered) {
            int t = s.ownTimeSeconds != null
                    ? BigDecimal.valueOf(s.ownTimeSeconds).multiply(s.quantity)
                        .setScale(0, RoundingMode.HALF_UP).intValue()
                    : 0;
            seqTime += t;
            steps.add(CraftPlanDto.CraftStep.from(s.item, stepNum++,
                    s.quantity.setScale(4, RoundingMode.HALF_UP), t));
        }

        // Sotib olish ro'yxati: QOLGAN xomashyo - inventarda bor (kamida 0).
        List<CraftPlanDto.ShoppingEntry> shopping = res.rawNeed.entrySet().stream()
                .sorted(Map.Entry.<Long, BigDecimal>comparingByValue().reversed())
                .map(e -> {
                    CraftItem raw = res.lookup.get(e.getKey());
                    BigDecimal needed = e.getValue();
                    BigDecimal have = inv.getOrDefault(e.getKey(), BigDecimal.ZERO);
                    BigDecimal toProcure = needed.subtract(have).max(BigDecimal.ZERO);
                    return CraftPlanDto.ShoppingEntry.from(raw,
                            needed.setScale(4, RoundingMode.HALF_UP),
                            have.setScale(4, RoundingMode.HALF_UP),
                            toProcure.setScale(4, RoundingMode.HALF_UP));
                })
                .collect(Collectors.toList());

        int parallel = res.parallelSeconds;

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

    // -------------------------------------------------------------------------
    // Kraft yechimi — inventardagi oraliq itemlarni ham hisobga oladi
    // -------------------------------------------------------------------------

    /** Kraft yechimi: inventardan nima sarflanadi, nima yasaladi, nima yetmaydi. */
    public static final class CraftResolution {
        /** itemId → inventardan ayiriladigan butun dona (oraliq itemlar ham, xomashyo ham). */
        public final Map<Long, Integer> consumed = new LinkedHashMap<>();
        /** itemId → xomashyodan jami kerak bo'lgan miqdor (yuqoriga yaxlitlangan). */
        public final Map<Long, Integer> required = new LinkedHashMap<>();
        /** itemId → yetishmayotgan miqdor (bo'sh bo'lsa — hammasi yetarli). */
        public final Map<Long, Integer> shortfall = new LinkedHashMap<>();
        /** Haqiqatan yasalishi kerak bo'lgan oraliq itemlar (inventarda tayyorlari chiqarib tashlangan). */
        public final Map<Long, ResolvedStep> toCraft = new LinkedHashMap<>();
        /** itemId → xomashyodan kerak bo'lgan KASR miqdor (yaxlitlanmagan — reja shuni ko'rsatadi). */
        public final Map<Long, BigDecimal> rawNeed = new LinkedHashMap<>();
        /** Xabarlar uchun item ma'lumotlari. */
        public final Map<Long, CraftItem> lookup = new HashMap<>();
        /** Kritik yo'l (parallel) vaqti — inventardagi tayyor itemlar hisobga olingan. */
        public int parallelSeconds;
    }

    /** Yechim natijasidagi bitta yasash qadami. */
    public static final class ResolvedStep {
        public final CraftItem item;
        public BigDecimal quantity = BigDecimal.ZERO;
        public int maxDepth;
        public Integer ownTimeSeconds;

        ResolvedStep(CraftItem item) {
            this.item = item;
        }
    }

    /**
     * {@code quantity} dona {@code target} yasash uchun nima sarflanishini hisoblaydi.
     * <p>
     * Inventardagi <b>oraliq itemlar</b> ham ishlatiladi: kerakli oraliq item qo'lda bo'lsa, u butun
     * donalab olinadi va uning xomashyosi qaytadan talab qilinmaydi — faqat qolgan qismi yasaladi.
     * Xomashyo talabi esa butun daraxt bo'ylab kasr holida yig'iladi va faqat <b>oxirida bir marta</b>
     * yuqoriga yaxlitlanadi (har tugunda emas), aks holda bir xil xomashyo bir necha tarmoqda
     * takror yaxlitlanib ortiqcha sarflanardi.
     * <p>
     * Maqsad itemning o'zi inventardan olinmaydi — u yasaladi.
     */
    public CraftResolution resolveCraft(CraftItem target, GameVersion gv, BigDecimal quantity,
                                        Map<Long, BigDecimal> inventory) {
        Map<Long, BigDecimal> available = new HashMap<>();
        if (inventory != null) {
            inventory.forEach((id, q) -> {
                if (id != null && q != null) {
                    available.put(id, q);
                }
            });
        }
        CraftResolution res = new CraftResolution();
        res.parallelSeconds = resolveNode(target, gv, quantity, true, 0, available, res, new HashSet<>());

        for (Map.Entry<Long, BigDecimal> e : res.rawNeed.entrySet()) {
            BigDecimal need = e.getValue().setScale(0, RoundingMode.CEILING);
            BigDecimal have = available.getOrDefault(e.getKey(), BigDecimal.ZERO);
            BigDecimal take = need.min(have);
            res.required.merge(e.getKey(), need.intValue(), Integer::sum);
            if (take.signum() > 0) {
                res.consumed.merge(e.getKey(), take.intValue(), Integer::sum);
            }
            BigDecimal miss = need.subtract(take);
            if (miss.signum() > 0) {
                res.shortfall.merge(e.getKey(), miss.intValue(), Integer::sum);
            }
        }
        return res;
    }

    /**
     * Bitta tugunni yechadi va shu tarmoqning <b>kritik yo'l</b> vaqtini (sekund) qaytaradi.
     * Inventarda tayyor bo'lgan tarmoq 0 qaytaradi — ya'ni parallel vaqt ham inventarni hisobga oladi.
     */
    private int resolveNode(CraftItem item, GameVersion gv, BigDecimal needed, boolean isRoot, int depth,
                            Map<Long, BigDecimal> available, CraftResolution res, Set<Long> visited) {
        if (needed.signum() <= 0) {
            return 0;
        }
        res.lookup.putIfAbsent(item.getId(), item);

        boolean leaf = depth > MAX_DEPTH
                || RAW_CATEGORY.equals(item.getCategory().getCode())
                || visited.contains(item.getId());
        Optional<Recipe> recipeOpt = leaf
                ? Optional.empty()
                : recipeRepository.findByResultItemIdAndGameVersionId(item.getId(), gv.getId());

        if (recipeOpt.isEmpty() || recipeOpt.get().getIngredients().isEmpty()) {
            // Yasab bo'lmaydi — xomashyo sifatida yig'amiz (yaxlitlash oxirida bir marta).
            res.rawNeed.merge(item.getId(), needed, BigDecimal::add);
            return 0;
        }

        // Oraliq item: inventarda bori butun donalab ishlatiladi, qolgani yasaladi.
        if (!isRoot) {
            BigDecimal have = available.getOrDefault(item.getId(), BigDecimal.ZERO);
            if (have.signum() > 0) {
                BigDecimal take = have.min(needed.setScale(0, RoundingMode.CEILING));
                available.put(item.getId(), have.subtract(take));
                res.consumed.merge(item.getId(), take.intValue(), Integer::sum);
                needed = needed.subtract(take);
                if (needed.signum() <= 0) {
                    return 0; // tayyor — yasash ham, vaqt ham kerak emas
                }
            }
        }

        Recipe recipe = recipeOpt.get();
        Integer ownTime = recipe.getCraftTimeSeconds() != null
                ? recipe.getCraftTimeSeconds() : item.getCraftTimeSeconds();

        ResolvedStep step = res.toCraft.computeIfAbsent(item.getId(), k -> new ResolvedStep(item));
        step.quantity = step.quantity.add(needed);
        step.maxDepth = Math.max(step.maxDepth, depth);
        step.ownTimeSeconds = ownTime;

        int ownSeconds = ownTime != null
                ? BigDecimal.valueOf(ownTime).multiply(needed).setScale(0, RoundingMode.HALF_UP).intValue()
                : 0;

        visited.add(item.getId());
        int maxChild = 0;
        for (RecipeIngredient ri : recipe.getIngredients()) {
            int childPath = resolveNode(ri.getIngredientItem(), gv, ri.getQuantity().multiply(needed),
                    false, depth + 1, available, res, new HashSet<>(visited));
            maxChild = Math.max(maxChild, childPath);
        }
        return ownSeconds + maxChild;
    }
}
