package com.crafttree.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CraftItemDto {
    private Long id;
    private String name;
    private String nameUz;
    private String nameEn;
    private String nameUzCyr;
    private String description;
    private String descriptionUz;
    private String descriptionEn;
    private String descriptionUzCyr;
    private String categoryCode;
    private String categoryNameRu;
    private String categoryNameUz;
    private String categoryNameEn;
    private String categoryNameUzCyr;
    private Integer craftTimeSeconds;
    private String imageUrl;
    private List<RecipeIngredientDto> ingredients;
}
