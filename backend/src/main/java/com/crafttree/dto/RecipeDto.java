package com.crafttree.dto;

import com.crafttree.entity.Recipe;
import com.crafttree.entity.RecipeIngredient;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeDto {
    private Long id;
    private Long resultItemId;
    private String resultItemName;
    private String gameVersion;
    private Long gameVersionId;
    private Integer craftTimeSeconds;
    private String notes;
    private String createdByUsername;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<Ingredient> ingredients;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Ingredient {
        private Long ingredientItemId;
        private String ingredientName;
        private String ingredientNameUz;
        private String ingredientNameEn;
        private String ingredientNameUzCyr;
        private String ingredientCategory;
        private String ingredientImageUrl;
        private BigDecimal quantity;
    }

    public static RecipeDto from(Recipe r) {
        List<Ingredient> ings = r.getIngredients().stream()
                .sorted(Comparator.comparing(ri -> ri.getIngredientItem().getName(), String.CASE_INSENSITIVE_ORDER))
                .map(RecipeDto::ingredientFrom)
                .toList();

        return RecipeDto.builder()
                .id(r.getId())
                .resultItemId(r.getResultItem().getId())
                .resultItemName(r.getResultItem().getName())
                .gameVersion(r.getGameVersion().getVersion())
                .gameVersionId(r.getGameVersion().getId())
                .craftTimeSeconds(r.getCraftTimeSeconds())
                .notes(r.getNotes())
                .createdByUsername(r.getCreatedBy() != null ? r.getCreatedBy().getUsername() : null)
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .ingredients(ings)
                .build();
    }

    private static Ingredient ingredientFrom(RecipeIngredient ri) {
        var item = ri.getIngredientItem();
        return Ingredient.builder()
                .ingredientItemId(item.getId())
                .ingredientName(item.getName())
                .ingredientNameUz(item.getNameUz())
                .ingredientNameEn(item.getNameEn())
                .ingredientNameUzCyr(item.getNameUzCyr())
                .ingredientCategory(item.getCategory().getCode())
                .ingredientImageUrl(item.getImageUrl())
                .quantity(ri.getQuantity())
                .build();
    }
}
