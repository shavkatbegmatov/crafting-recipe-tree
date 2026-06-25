package com.crafttree.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Kraft rejasi so'rovi: nechta dona yasash kerak, qaysi versiyada, va (ixtiyoriy)
 * foydalanuvchi inventari (shopping list inventardan ayiriladi).
 */
public record CraftPlanRequest(
        int targetQuantity,
        String gameVersion,
        List<InventoryEntry> inventory
) {
    public record InventoryEntry(Long itemId, BigDecimal quantity) {}
}
