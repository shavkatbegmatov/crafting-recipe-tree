package com.crafttree.service;

import com.crafttree.dto.*;
import com.crafttree.entity.CraftItem;
import com.crafttree.entity.RecipeIngredient;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.CategoryRepository;
import com.crafttree.repository.CraftItemRepository;
import com.crafttree.repository.RecipeIngredientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CraftItemService {

    private final CraftItemRepository craftItemRepository;
    private final CategoryRepository categoryRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;

    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAllByOrderBySortOrderAsc().stream()
                .map(c -> CategoryDto.builder()
                        .id(c.getId())
                        .code(c.getCode())
                        .nameRu(c.getNameRu())
                        .nameUz(c.getNameUz())
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
        CraftItem item = craftItemRepository.findById(id)
                .orElseThrow(() -> new ItemNotFoundException(id));
        return toDtoWithIngredients(item);
    }

    public List<CraftItemDto> searchItems(String query) {
        return craftItemRepository.searchByName(query).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<UsedInDto> getUsedIn(Long itemId) {
        if (!craftItemRepository.existsById(itemId)) {
            throw new ItemNotFoundException(itemId);
        }
        return recipeIngredientRepository.findByIngredientItemId(itemId).stream()
                .map(ri -> UsedInDto.builder()
                        .itemId(ri.getResultItem().getId())
                        .itemName(ri.getResultItem().getName())
                        .categoryCode(ri.getResultItem().getCategory().getCode())
                        .quantity(ri.getQuantity())
                        .build())
                .collect(Collectors.toList());
    }

    private CraftItemDto toDto(CraftItem item) {
        return CraftItemDto.builder()
                .id(item.getId())
                .name(item.getName())
                .description(item.getDescription())
                .categoryCode(item.getCategory().getCode())
                .categoryNameRu(item.getCategory().getNameRu())
                .categoryNameUz(item.getCategory().getNameUz())
                .craftTimeSeconds(item.getCraftTimeSeconds())
                .build();
    }

    private CraftItemDto toDtoWithIngredients(CraftItem item) {
        List<RecipeIngredient> ingredients = recipeIngredientRepository.findByResultItemId(item.getId());
        List<RecipeIngredientDto> ingredientDtos = ingredients.stream()
                .map(ri -> RecipeIngredientDto.builder()
                        .ingredientItemId(ri.getIngredientItem().getId())
                        .ingredientName(ri.getIngredientItem().getName())
                        .ingredientCategory(ri.getIngredientItem().getCategory().getCode())
                        .quantity(ri.getQuantity())
                        .build())
                .collect(Collectors.toList());

        CraftItemDto dto = toDto(item);
        dto.setIngredients(ingredientDtos);
        return dto;
    }
}
