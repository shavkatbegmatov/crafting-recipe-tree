package com.crafttree.dto.portage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportItemDto {

    private String name;
    private String nameUz;
    private String nameEn;
    private String nameUzCyr;

    private String description;
    private String descriptionUz;
    private String descriptionEn;
    private String descriptionUzCyr;

    private String categoryCode;

    private Integer craftTimeSeconds;

    private String imageFilename;

    @Builder.Default
    private List<String> tagCodes = new ArrayList<>();

    @Builder.Default
    private List<Recipe> recipe = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Recipe {
        private String ingredientName;
        private BigDecimal quantity;
    }
}
