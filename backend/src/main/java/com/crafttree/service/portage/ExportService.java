package com.crafttree.service.portage;

import com.crafttree.dto.portage.ExportCategoryDto;
import com.crafttree.dto.portage.ExportItemDto;
import com.crafttree.dto.portage.ExportManifestDto;
import com.crafttree.dto.portage.ExportPackageDto;
import com.crafttree.dto.portage.ExportTagDto;
import com.crafttree.entity.Category;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.entity.Tag;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeRepository;
import com.crafttree.service.GameVersionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Deque;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExportService {

    public static final String GENERATOR = "crafting-recipe-tree";

    private final CraftItemRepository craftItemRepository;
    private final RecipeRepository recipeRepository;
    private final GameVersionService gameVersionService;

    public record ExportSelection(
            List<Long> itemIds,
            String categoryCode,
            String tagCode,
            boolean all,
            boolean withDependencies,
            String label
    ) {
        public static ExportSelection allItems() {
            return new ExportSelection(List.of(), null, null, true, false, "all");
        }

        public static ExportSelection byIds(List<Long> ids, boolean withDeps) {
            return new ExportSelection(ids, null, null, false, withDeps,
                    "items:" + ids.size());
        }

        public static ExportSelection byCategory(String code, boolean withDeps) {
            return new ExportSelection(List.of(), code, null, false, withDeps,
                    "category:" + code);
        }

        public static ExportSelection byTag(String code, boolean withDeps) {
            return new ExportSelection(List.of(), null, code, false, withDeps,
                    "tag:" + code);
        }
    }

    @Transactional(readOnly = true)
    public ExportPackageDto buildPackage(ExportSelection selection) {
        List<CraftItem> roots = resolveRoots(selection);
        List<CraftItem> items = selection.all() || selection.withDependencies()
                ? expandDependencies(roots)
                : roots;

        items.sort(Comparator.comparing(CraftItem::getName, String.CASE_INSENSITIVE_ORDER));

        Map<String, Category> categoriesByCode = new LinkedHashMap<>();
        Map<String, Tag> tagsByCode = new LinkedHashMap<>();
        for (CraftItem ci : items) {
            Category cat = ci.getCategory();
            if (cat != null) categoriesByCode.putIfAbsent(cat.getCode(), cat);
            Set<Tag> tags = ci.getTags();
            if (tags != null) {
                for (Tag t : tags) tagsByCode.putIfAbsent(t.getCode(), t);
            }
        }

        // Export uses the current game version's recipes only. Multi-version export is a separate feature.
        Long currentVersionId = gameVersionService.getCurrent().getId();
        Set<Long> itemIdSet = items.stream().map(CraftItem::getId).collect(Collectors.toSet());

        List<Recipe> versionRecipes = recipeRepository.findByGameVersionId(currentVersionId);
        List<RecipeIngredient> recipes = versionRecipes.stream()
                .filter(r -> itemIdSet.contains(r.getResultItem().getId()))
                .flatMap(r -> r.getIngredients().stream())
                .filter(ri -> itemIdSet.contains(ri.getIngredientItem().getId()))
                .collect(Collectors.toList());

        Map<Long, List<RecipeIngredient>> recipesByResult = new LinkedHashMap<>();
        for (RecipeIngredient ri : recipes) {
            recipesByResult.computeIfAbsent(ri.getRecipe().getResultItem().getId(), k -> new ArrayList<>()).add(ri);
        }

        List<ExportCategoryDto> categoriesDto = categoriesByCode.values().stream()
                .sorted(Comparator.comparing(c -> safeOrder(c.getSortOrder())))
                .map(c -> ExportCategoryDto.builder()
                        .code(c.getCode())
                        .nameRu(c.getNameRu())
                        .nameUz(c.getNameUz())
                        .nameEn(c.getNameEn())
                        .nameUzCyr(c.getNameUzCyr())
                        .color(c.getColor())
                        .icon(c.getIcon())
                        .sortOrder(c.getSortOrder())
                        .build())
                .toList();

        List<ExportTagDto> tagsDto = tagsByCode.values().stream()
                .sorted(Comparator.comparing(t -> safeOrder(t.getSortOrder())))
                .map(t -> ExportTagDto.builder()
                        .code(t.getCode())
                        .nameRu(t.getNameRu())
                        .nameUz(t.getNameUz())
                        .nameEn(t.getNameEn())
                        .nameUzCyr(t.getNameUzCyr())
                        .color(t.getColor())
                        .sortOrder(t.getSortOrder())
                        .build())
                .toList();

        List<ExportItemDto> itemsDto = items.stream().map(item -> {
            List<ExportItemDto.Recipe> recipeRows = recipesByResult.getOrDefault(item.getId(), List.of()).stream()
                    .sorted(Comparator.comparing(r -> r.getIngredientItem().getName(),
                            String.CASE_INSENSITIVE_ORDER))
                    .map(r -> ExportItemDto.Recipe.builder()
                            .ingredientName(r.getIngredientItem().getName())
                            .quantity(r.getQuantity())
                            .build())
                    .toList();

            List<String> tagCodes = item.getTags() == null ? List.of()
                    : item.getTags().stream()
                            .map(Tag::getCode)
                            .filter(Objects::nonNull)
                            .sorted()
                            .toList();

            return ExportItemDto.builder()
                    .name(item.getName())
                    .nameUz(item.getNameUz())
                    .nameEn(item.getNameEn())
                    .nameUzCyr(item.getNameUzCyr())
                    .description(item.getDescription())
                    .descriptionUz(item.getDescriptionUz())
                    .descriptionEn(item.getDescriptionEn())
                    .descriptionUzCyr(item.getDescriptionUzCyr())
                    .categoryCode(item.getCategory() != null ? item.getCategory().getCode() : null)
                    .craftTimeSeconds(item.getCraftTimeSeconds())
                    .imageFilename(PortageImagePaths.filenameOf(item.getImageUrl()))
                    .tagCodes(tagCodes)
                    .recipe(recipeRows)
                    .build();
        }).toList();

        ExportManifestDto manifest = ExportManifestDto.builder()
                .formatVersion(ExportManifestDto.CURRENT_FORMAT_VERSION)
                .generator(GENERATOR)
                .exportedAt(OffsetDateTime.now(ZoneOffset.UTC))
                .selection(selection.label())
                .categoriesCount(categoriesDto.size())
                .tagsCount(tagsDto.size())
                .itemsCount(itemsDto.size())
                .recipeRowsCount(recipes.size())
                .build();

        return ExportPackageDto.builder()
                .manifest(manifest)
                .categories(categoriesDto)
                .tags(tagsDto)
                .items(itemsDto)
                .build();
    }

    private List<CraftItem> resolveRoots(ExportSelection s) {
        if (s.all()) {
            return craftItemRepository.findAllByOrderByCategoryIdAscNameAsc();
        }
        if (s.itemIds() != null && !s.itemIds().isEmpty()) {
            return craftItemRepository.findAllById(s.itemIds());
        }
        if (s.categoryCode() != null && !s.categoryCode().isBlank()) {
            return craftItemRepository.findByCategoryCode(s.categoryCode());
        }
        if (s.tagCode() != null && !s.tagCode().isBlank()) {
            return craftItemRepository.findAll().stream()
                    .filter(it -> it.getTags() != null
                            && it.getTags().stream().anyMatch(t -> s.tagCode().equals(t.getCode())))
                    .toList();
        }
        return List.of();
    }

    private List<CraftItem> expandDependencies(List<CraftItem> roots) {
        Set<Long> visited = new TreeSet<>();
        List<CraftItem> ordered = new ArrayList<>();
        Deque<CraftItem> stack = new ArrayDeque<>(roots);
        Long currentVersionId = gameVersionService.getCurrent().getId();

        while (!stack.isEmpty()) {
            CraftItem ci = stack.pop();
            if (ci.getId() == null || !visited.add(ci.getId())) continue;
            ordered.add(ci);
            List<RecipeIngredient> ris = recipeRepository
                    .findByResultItemIdAndGameVersionId(ci.getId(), currentVersionId)
                    .map(Recipe::getIngredients)
                    .orElseGet(List::of);
            for (RecipeIngredient ri : ris) {
                CraftItem dep = ri.getIngredientItem();
                if (dep != null && dep.getId() != null && !visited.contains(dep.getId())) {
                    stack.push(dep);
                }
            }
        }
        // Stable secondary order — by name — applied by caller.
        return new ArrayList<>(new HashSet<>(ordered)).stream()
                .sorted(Comparator.comparing(CraftItem::getName, String.CASE_INSENSITIVE_ORDER))
                .collect(Collectors.toList());
    }

    private static int safeOrder(Integer order) {
        return order == null ? Integer.MAX_VALUE : order;
    }
}
