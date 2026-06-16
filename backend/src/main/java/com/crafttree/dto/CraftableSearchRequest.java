package com.crafttree.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * "Nima yasay olaman?" so'rovi: foydalanuvchida mavjud materiallar ro'yxati.
 * {@code gameVersion} null/bo'sh bo'lsa — joriy versiya ishlatiladi.
 */
public record CraftableSearchRequest(
        String gameVersion,
        List<MaterialEntry> materials
) {
    /** Foydalanuvchida bor material: item id + miqdori. */
    public record MaterialEntry(Long itemId, BigDecimal quantity) {}
}
