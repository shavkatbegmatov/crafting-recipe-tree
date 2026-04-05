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
    private Integer totalCraftTimeSeconds;
    private List<RawMaterialEntry> rawMaterials;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RawMaterialEntry {
        private String name;
        private BigDecimal totalQuantity;
    }
}
