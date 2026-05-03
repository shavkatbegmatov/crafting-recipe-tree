package com.crafttree.service;

import com.crafttree.dto.RecipeDto;
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
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RecipeService {

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
        CraftItem item = craftItemRepository.findById(itemId)
                .orElseThrow(() -> new ItemNotFoundException(itemId));
        GameVersion gv = gameVersionService.resolveOrCurrent(version);

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
        Recipe reloaded = recipeRepository.findById(recipe.getId()).orElseThrow();
        return RecipeDto.from(reloaded);
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
