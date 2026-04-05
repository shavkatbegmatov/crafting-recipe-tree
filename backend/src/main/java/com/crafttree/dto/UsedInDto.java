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
    private String categoryCode;
    private BigDecimal quantity;
}
