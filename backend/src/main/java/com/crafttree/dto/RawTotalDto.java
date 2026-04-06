package com.crafttree.dto;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RawTotalDto {
    private Long itemId;
    private String itemName;
    private String itemNameUz;
    private String itemNameEn;
    private String itemNameUzCyr;
    private Integer totalCraftTimeSeconds;
    private List<RawMaterialEntry> rawMaterials;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RawMaterialEntry {
        private String name;
        private String nameUz;
        private String nameEn;
        private String nameUzCyr;
        private BigDecimal totalQuantity;
    }
}
