package com.crafttree.dto;

import lombok.Builder;

import java.util.List;

/**
 * Bulk craft natijasi. {@code success=false} bo'lsa — {@code missing} to'ldiriladi va
 * inventar o'zgarmaydi. {@code success=true} bo'lsa — yangilangan inventar va tarix yozuvi.
 */
@Builder
public record CraftResultDto(
        boolean success,
        List<MissingEntry> missing,
        List<InventoryEntryDto> newInventory,
        CraftLogDto log
) {
    /** Yetishmayotgan xomashyo: nechta kerak va inventarda nechta bor. */
    public record MissingEntry(
            Long itemId,
            String name,
            String nameUz,
            String nameEn,
            String nameUzCyr,
            int needed,
            int have
    ) {}
}
