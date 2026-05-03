package com.crafttree.dto;

import lombok.*;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsedInDto {
    private Long itemId;
    private String itemName;
    private String itemNameUz;
    private String itemNameEn;
    private String itemNameUzCyr;
    private String categoryCode;
    private String imageUrl;
    private BigDecimal quantity;
}
