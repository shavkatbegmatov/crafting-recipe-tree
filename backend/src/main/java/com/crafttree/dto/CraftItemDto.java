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
    private String description;
    private String categoryCode;
    private String categoryNameRu;
    private String categoryNameUz;
    private Integer craftTimeSeconds;
    private List<RecipeIngredientDto> ingredients;
}
