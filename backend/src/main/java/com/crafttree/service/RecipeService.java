package com.crafttree.service;

import com.crafttree.dto.CopyTreeReportDto;
import com.crafttree.dto.RecipeDto;
import com.crafttree.entity.Category;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.GameVersion;
import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.entity.User;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeIngredientRepository;
import com.crafttree.repository.RecipeRepository;
import com.crafttree.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RecipeService {

    private static final int MAX_DEPTH = 20;
    private static final String RAW_CATEGORY = "RAW";

    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final CraftItemRepository craftItemRepository;
    private final UserRepository userRepository;
    private final GameVersionService gameVersionService;

    @Transactional(readOnly = true)
    public List<RecipeDto> findAllForItem(Long itemId) {
        if (!craftItemRepository.existsById(itemId)) {
            throw new ItemNotFoundException(itemId);
        }
        return recipeRepository.findByResultItemIdOrderByGameVersionReleasedAtDesc(itemId).stream()
                .map(RecipeDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public RecipeDto findOne(Long itemId, String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        return recipeRepository.findByResultItemIdAndGameVersionId(itemId, gv.getId())
                .map(RecipeDto::from)
                .orElse(null);
    }

    /**
     * Replace (or create) the recipe for {@code (itemId, version)} with the given ingredients.
     * The set of ingredients is a full overwrite — anything not in the request is removed.
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "recipeTrees",  allEntries = true),
            @CacheEvict(value = "rawTotals",    allEntries = true),
            @CacheEvict(value = "craftTimes",   allEntries = true),
    })
    public RecipeDto upsertRecipe(Long itemId, String version, UpsertRequest request) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        Recipe reloaded = writeRecipeNoCacheEvict(itemId, gv, request);
        return RecipeDto.from(reloaded);
    }

    /**
     * Internal write — same semantics as {@link #upsertRecipe} but without the cache eviction
     * annotation, so callers performing many writes in a single unit of work (e.g. the tree copy)
     * can evict the cache once at the end instead of once per recipe.
     */
    private Recipe writeRecipeNoCacheEvict(Long itemId, GameVersion gv, UpsertRequest request) {
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));

        Recipe recipe = recipeRepository.findByResultItemIdAndGameVersionId(itemId, gv.getId())
                .orElseGet(() -> Recipe.builder()
                        .resultItem(item)
                        .gameVersion(gv)
                        .build());

        recipe.setCraftTimeSeconds(request.craftTimeSeconds() != null ? request.craftTimeSeconds() : 0);
        recipe.setNotes(request.notes());
        if (recipe.getId() == null) {
            recipe.setCreatedBy(currentUserOrNull());
        }
        recipe = recipeRepository.save(recipe);

        // Replace ingredient rows.
        if (recipe.getId() != null) {
            recipeIngredientRepository.deleteAllByRecipeId(recipe.getId());
        }

        Set<Long> seen = new HashSet<>();
        if (request.ingredients() != null) {
            for (IngredientLine line : request.ingredients()) {
                if (line == null || line.ingredientItemId() == null) continue;
                if (!seen.add(line.ingredientItemId())) continue;  // dedup

                CraftItem ing = craftItemRepository.findById(line.ingredientItemId())
                        .orElseThrow(() -> new ItemNotFoundException(line.ingredientItemId()));
                if (ing.getId().equals(item.getId())) {
                    throw new IllegalArgumentException("Recipe cannot reference itself as an ingredient");
                }
                BigDecimal qty = line.quantity() != null ? line.quantity() : BigDecimal.ZERO;
                recipeIngredientRepository.upsert(recipe.getId(), ing.getId(), qty);
            }
        }

        // Re-load to pick up freshly inserted ingredient rows.
        return recipeRepository.findById(recipe.getId()).orElseThrow();
    }

    /**
     * Copy a recipe from one version to another. Useful for "kicking off" a new game version.
     * If the target already has a recipe, it is overwritten only when {@code overwrite} is true.
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "recipeTrees",  allEntries = true),
            @CacheEvict(value = "rawTotals",    allEntries = true),
            @CacheEvict(value = "craftTimes",   allEntries = true),
    })
    public RecipeDto copyFromVersion(Long itemId, String fromVersion, String toVersion, boolean overwrite) {
        if (fromVersion == null || fromVersion.isBlank()) {
            throw new IllegalArgumentException("fromVersion is required");
        }
        GameVersion source = gameVersionService.resolveOrCurrent(fromVersion);
        GameVersion target = gameVersionService.resolveOrCurrent(toVersion);

        Recipe sourceRecipe = recipeRepository.findByResultItemIdAndGameVersionId(itemId, source.getId())
                .orElseThrow(() -> new IllegalStateException(
                        "No source recipe for item " + itemId + " in version " + source.getVersion()));

        Optional<Recipe> existingTarget = recipeRepository.findByResultItemIdAndGameVersionId(itemId, target.getId());
        if (existingTarget.isPresent() && !overwrite) {
            throw new IllegalStateException("Target version already has a recipe; pass overwrite=true to replace");
        }

        UpsertRequest payload = new UpsertRequest(
                sourceRecipe.getCraftTimeSeconds(),
                sourceRecipe.getNotes(),
                sourceRecipe.getIngredients().stream()
                        .map(ri -> new IngredientLine(ri.getIngredientItem().getId(), ri.getQuantity()))
                        .toList()
        );
        return upsertRecipe(itemId, target.getVersion(), payload);
    }

    /**
     * Copy the entire recipe sub-tree rooted at {@code rootItemId} from {@code fromVersion}
     * to {@code toVersion}. Traversal is bounded by {@link #MAX_DEPTH} and protected against
     * cycles, RAW items have no recipe (skipped).
     *
     * @param dryRun  when true, no DB writes happen — only the report is computed
     */
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "recipeTrees",  allEntries = true),
            @CacheEvict(value = "rawTotals",    allEntries = true),
            @CacheEvict(value = "craftTimes",   allEntries = true),
    })
    public CopyTreeReportDto copyTreeFromVersion(
            Long rootItemId, String fromVersion, String toVersion,
            ConflictPolicy policy, boolean dryRun) {

        if (fromVersion == null || fromVersion.isBlank()) {
            throw new IllegalArgumentException("fromVersion is required");
        }
        if (policy == null) policy = ConflictPolicy.SKIP_EXISTING;

        GameVersion source = gameVersionService.resolveOrCurrent(fromVersion);
        GameVersion target = gameVersionService.resolveOrCurrent(toVersion);
        if (source.getId().equals(target.getId())) {
            throw new IllegalArgumentException("fromVersion and toVersion must differ");
        }

        // Sanity-check the root item exists at all.
        if (!craftItemRepository.existsById(rootItemId)) {
            throw new ItemNotFoundException(rootItemId);
        }

        // Bulk-fetch source recipes (with ingredients eagerly loaded) to avoid N+1 during traversal.
        Map<Long, Recipe> sourceByItemId = new HashMap<>();
        for (Recipe r : recipeRepository.findAllWithIngredientsByGameVersionId(source.getId())) {
            sourceByItemId.put(r.getResultItem().getId(), r);
        }
        // Set of item ids that already have a recipe in the target version.
        Set<Long> targetExistingItemIds = new HashSet<>();
        for (Recipe r : recipeRepository.findByGameVersionId(target.getId())) {
            targetExistingItemIds.add(r.getResultItem().getId());
        }

        Recipe rootSource = sourceByItemId.get(rootItemId);
        if (rootSource == null) {
            throw new IllegalStateException(
                    "No source recipe for item " + rootItemId + " in version " + source.getVersion());
        }

        CopyTreeReportDto report = CopyTreeReportDto.builder()
                .fromVersion(source.getVersion())
                .toVersion(target.getVersion())
                .rootItemId(rootItemId)
                .conflictPolicy(policy.name())
                .dryRun(dryRun)
                .build();

        Set<Long> visited = new HashSet<>();
        Deque<Long> stack = new ArrayDeque<>();
        Map<Long, Integer> depthOf = new HashMap<>();
        stack.push(rootItemId);
        depthOf.put(rootItemId, 0);

        while (!stack.isEmpty()) {
            Long itemId = stack.pop();
            if (!visited.add(itemId)) continue;

            int depth = depthOf.getOrDefault(itemId, 0);
            if (depth > MAX_DEPTH) {
                report.setMaxDepthReached(true);
                continue;
            }

            Recipe sourceRecipe = sourceByItemId.get(itemId);
            CraftItem item = sourceRecipe != null
                    ? sourceRecipe.getResultItem()
                    : craftItemRepository.findById(itemId).orElse(null);
            if (item == null) {
                // Item was removed since the report was started — skip silently.
                continue;
            }

            // RAW items don't carry recipes; record and move on (don't recurse).
            if (item.getCategory() != null && RAW_CATEGORY.equals(item.getCategory().getCode())) {
                report.getMissingInSource().add(toEntry(item, null));
                continue;
            }

            if (sourceRecipe == null) {
                // Reached a non-RAW leaf with no source recipe — record but don't recurse.
                report.getMissingInSource().add(toEntry(item, null));
                continue;
            }

            boolean exists = targetExistingItemIds.contains(itemId);
            boolean shouldWrite;
            switch (policy) {
                case OVERWRITE_ALL -> shouldWrite = true;
                case SKIP_EXISTING, FILL_GAPS_ONLY -> shouldWrite = !exists;
                default -> shouldWrite = !exists;
            }

            if (shouldWrite) {
                if (!dryRun) {
                    UpsertRequest payload = new UpsertRequest(
                            sourceRecipe.getCraftTimeSeconds(),
                            sourceRecipe.getNotes(),
                            sourceRecipe.getIngredients().stream()
                                    .map(ri -> new IngredientLine(ri.getIngredientItem().getId(), ri.getQuantity()))
                                    .toList()
                    );
                    writeRecipeNoCacheEvict(itemId, target, payload);
                }
                if (exists) {
                    report.getOverwritten().add(toEntry(item, sourceRecipe.getId()));
                } else {
                    report.getCopied().add(toEntry(item, sourceRecipe.getId()));
                }
            } else {
                report.getSkipped().add(toEntry(item, sourceRecipe.getId()));
            }

            // Recurse into ingredients regardless of whether we wrote — children may still need copying.
            for (RecipeIngredient ri : sourceRecipe.getIngredients()) {
                Long childId = ri.getIngredientItem().getId();
                if (visited.contains(childId)) continue;
                stack.push(childId);
                depthOf.merge(childId, depth + 1, Math::min);
            }
        }

        report.setVisited(visited.size());
        return report;
    }

    private static CopyTreeReportDto.Entry toEntry(CraftItem item, Long sourceRecipeId) {
        Category cat = item.getCategory();
        return CopyTreeReportDto.Entry.builder()
                .itemId(item.getId())
                .itemName(item.getName())
                .itemNameUz(item.getNameUz())
                .itemNameEn(item.getNameEn())
                .itemNameUzCyr(item.getNameUzCyr())
                .categoryCode(cat != null ? cat.getCode() : null)
                .imageUrl(item.getImageUrl())
                .sourceRecipeId(sourceRecipeId)
                .build();
    }

    @Transactional
    @Caching(evict = {
            @CacheEvict(value = "recipeTrees",  allEntries = true),
            @CacheEvict(value = "rawTotals",    allEntries = true),
            @CacheEvict(value = "craftTimes",   allEntries = true),
    })
    public void deleteRecipe(Long itemId, String version) {
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        Recipe recipe = recipeRepository.findByResultItemIdAndGameVersionId(itemId, gv.getId())
                .orElse(null);
        if (recipe == null) return;
        recipeIngredientRepository.deleteAllByRecipeId(recipe.getId());
        recipeRepository.deleteByResultItemIdAndGameVersionId(itemId, gv.getId());
    }

    private User currentUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof User u) return u;
        if (principal instanceof String username) {
            return userRepository.findByUsername(username).orElse(null);
        }
        return null;
    }

    public record UpsertRequest(
            Integer craftTimeSeconds,
            String notes,
            List<IngredientLine> ingredients
    ) {}

    public record IngredientLine(Long ingredientItemId, BigDecimal quantity) {}
}
