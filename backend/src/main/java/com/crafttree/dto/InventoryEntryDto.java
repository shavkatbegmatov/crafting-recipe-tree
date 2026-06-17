package com.crafttree.dto;

/**
 * Inventar yozuvi — item id va miqdor. Frontend bilan ikki tomonlama ishlatiladi
 * (GET javobi va PUT so'rovi bir xil shaklda).
 */
public record InventoryEntryDto(Long itemId, Integer quantity) {
}
