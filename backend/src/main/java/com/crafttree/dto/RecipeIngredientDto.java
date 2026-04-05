package com.crafttree.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeIngredientDto {
    private Long ingredientItemId;
    private String ingredientName;
    private String ingredientCategory;
    private BigDecimal quantity;
}
