package com.crafttree.dto;

import com.crafttree.entity.CraftLog;
import com.crafttree.entity.CraftItem;
import lombok.Builder;

/** Kraft tarixi yozuvi (ko'rsatish uchun). */
@Builder
public record CraftLogDto(
        Long id,
        Long resultItemId,
        String resultItemName,
        String resultItemNameUz,
        String resultItemNameEn,
        String resultItemNameUzCyr,
        String categoryCode,
        String imageUrl,
        int resultQuantity,
        String craftedAt
) {
    public static CraftLogDto from(CraftLog log) {
        CraftItem item = log.getResultItem();
        return CraftLogDto.builder()
                .id(log.getId())
                .resultItemId(item.getId())
                .resultItemName(item.getName())
                .resultItemNameUz(item.getNameUz())
                .resultItemNameEn(item.getNameEn())
                .resultItemNameUzCyr(item.getNameUzCyr())
                .categoryCode(item.getCategory().getCode())
                .imageUrl(item.getImageUrl())
                .resultQuantity(log.getResultQuantity())
                .craftedAt(log.getCraftedAt().toString())
                .build();
    }
}
