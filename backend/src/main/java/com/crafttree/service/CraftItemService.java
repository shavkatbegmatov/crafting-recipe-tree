package com.crafttree.service;

import com.crafttree.dto.*;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.GameVersion;
import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CategoryRepository;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeIngredientRepository;
import com.crafttree.repository.RecipeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CraftItemService {

    private final CraftItemRepository craftItemRepository;
    private final CategoryRepository categoryRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final RecipeRepository recipeRepository;
    private final GameVersionService gameVersionService;

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(c -> CategoryDto.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .nameRu(c.getNameRu())
                        .nameUz(c.getNameUz())
                        .nameEn(c.getNameEn())
                        .nameUzCyr(c.getNameUzCyr())
                        .color(c.getColor())
                        .icon(c.getIcon())
                        .sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());
    }

    public List<CraftItemDto> getAllItems(String categoryCode) {
        List<CraftItem> items;
        if (categoryCode != null && !categoryCode.isBlank()) {
            items = craftItemRepository.findByCategoryCode(categoryCode.toUpperCase());
        } else {
            items = craftItemRepository.findAllByOrderByCategoryIdAscNameAsc();
        }
        return items.stream().map(this::toDto).collect(Collectors.toList());
    }

    public CraftItemDto getItemById(Long id) {
        return getItemById(id, null);
    }

    public CraftItemDto getItemById(Long id, String version) {
        CraftItem item = craftItemRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        return toDtoWithIngredients(item, gv);
    }

    public List<CraftItemDto> searchItems(String query) {
        return craftItemRepository.searchByName(query).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public CraftItemDto updateItem(Long id, UpdateItemRequest request) {
        CraftItem item = craftItemRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));

        if (request.getCategoryId() != null) {
            item.setCategory(categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found: " + request.getCategoryId())));
        }
        if (request.getName() != null) item.setName(request.getName());
        if (request.getNameUz() != null) item.setNameUz(request.getNameUz());
        if (request.getNameEn() != null) item.setNameEn(request.getNameEn());
        if (request.getNameUzCyr() != null) item.setNameUzCyr(request.getNameUzCyr());
        if (request.getDescription() != null) item.setDescription(request.getDescription());
        if (request.getDescriptionUz() != null) item.setDescriptionUz(request.getDescriptionUz());
        if (request.getDescriptionEn() != null) item.setDescriptionEn(request.getDescriptionEn());
        if (request.getDescriptionUzCyr() != null) item.setDescriptionUzCyr(request.getDescriptionUzCyr());

        item.setUpdatedAt(java.time.LocalDateTime.now());
        craftItemRepository.save(item);

        return toDtoWithIngredients(item, gameVersionService.getCurrent());
    }

    public List<UsedInDto> getUsedIn(Long itemId, String version) {
        if (!craftItemRepository.existsById(itemId)) {
            throw new ItemNotFoundException(itemId);
        }
        GameVersion gv = gameVersionService.resolveOrCurrent(version);
        return recipeIngredientRepository
                .findByIngredientItemIdAndGameVersionId(itemId, gv.getId())
                .stream()
                .map(ri -> {
                    CraftItem result = ri.getRecipe().getResultItem();
                    return UsedInDto.builder()
                            .itemId(result.getId())
                            .itemName(result.getName())
                            .itemNameUz(result.getNameUz())
                            .itemNameEn(result.getNameEn())
                            .itemNameUzCyr(result.getNameUzCyr())
                            .categoryCode(result.getCategory().getCode())
                            .imageUrl(result.getImageUrl())
                            .quantity(ri.getQuantity())
                            .build();
                })
                .collect(Collectors.toList());
    }

    private CraftItemDto toDto(CraftItem item) {
        return CraftItemDto.builder()
                .id(item.getId())
                .name(item.getName())
                .nameUz(item.getNameUz())
                .nameEn(item.getNameEn())
                .nameUzCyr(item.getNameUzCyr())
                .description(item.getDescription())
                .descriptionUz(item.getDescriptionUz())
                .descriptionEn(item.getDescriptionEn())
                .descriptionUzCyr(item.getDescriptionUzCyr())
                .categoryCode(item.getCategory().getCode())
                .categoryNameRu(item.getCategory().getNameRu())
                .categoryNameUz(item.getCategory().getNameUz())
                .categoryNameEn(item.getCategory().getNameEn())
                .categoryNameUzCyr(item.getCategory().getNameUzCyr())
                .craftTimeSeconds(item.getCraftTimeSeconds())
                .imageUrl(item.getImageUrl())
                .tags(item.getTags().stream()
                        .map(tag -> TagDto.builder()
                                .id(tag.getId())
                                .code(tag.getCode())
                                .nameRu(tag.getNameRu())
                                .nameUz(tag.getNameUz())
                                .nameEn(tag.getNameEn())
                                .nameUzCyr(tag.getNameUzCyr())
                                .color(tag.getColor())
                                .sortOrder(tag.getSortOrder())
                                .build())
                        .sorted((a, b) -> (a.getSortOrder() != null ? a.getSortOrder() : 0) - (b.getSortOrder() != null ? b.getSortOrder() : 0))
                        .collect(Collectors.toList()))
                .build();
    }

    private CraftItemDto toDtoWithIngredients(CraftItem item, GameVersion gv) {
        Optional<Recipe> recipeOpt = recipeRepository.findByResultItemIdAndGameVersionId(item.getId(), gv.getId());
        List<RecipeIngredientDto> ingredientDtos = recipeOpt.map(r -> r.getIngredients().stream()
                        .map(ri -> RecipeIngredientDto.builder()
                                .ingredientItemId(ri.getIngredientItem().getId())
                                .ingredientName(ri.getIngredientItem().getName())
                                .ingredientNameUz(ri.getIngredientItem().getNameUz())
                                .ingredientNameEn(ri.getIngredientItem().getNameEn())
                                .ingredientNameUzCyr(ri.getIngredientItem().getNameUzCyr())
                                .ingredientCategory(ri.getIngredientItem().getCategory().getCode())
                                .ingredientImageUrl(ri.getIngredientItem().getImageUrl())
                                .quantity(ri.getQuantity())
                                .build())
                        .collect(Collectors.toList()))
                .orElseGet(java.util.Collections::emptyList);

        CraftItemDto dto = toDto(item);
        dto.setIngredients(ingredientDtos);
        // Item's effective craft time for this version: prefer recipe's, fall back to item's own.
        Integer effectiveCraftTime = recipeOpt.map(Recipe::getCraftTimeSeconds).orElse(item.getCraftTimeSeconds());
        dto.setCraftTimeSeconds(effectiveCraftTime);
        return dto;
    }
}
