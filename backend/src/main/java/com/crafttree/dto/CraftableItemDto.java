package com.crafttree.dto;

import com.crafttree.entity.CraftItem;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

/**
 * Teskari qidiruv natijasi: foydalanuvchi materiallaridan yasash mumkin (yoki deyarli mumkin)
 * bo'lgan bitta item.
 */
@Builder
public record CraftableItemDto(
        Long resultItemId,
        String resultItemName,
        String resultItemNameUz,
        String resultItemNameEn,
        String resultItemNameUzCyr,
        String categoryCode,
        String imageUrl,
        /** Mavjud materiallardan nechta dona yasash mumkin (0 — hozircha yetmaydi). */
        int maxCraftable,
        /** Kamida 1 dona to'liq yasaladimi. */
        boolean fullyCraftable,
        /** 0..1 — o'rtacha tayyorlik darajasi (har ingredient bo'yicha have/required, 1 dan oshmaydi). */
        double completeness,
        /** Retseptdagi jami ingredient turlari soni. */
        int totalIngredients,
        /** Yetishmayotgan ingredient turlari soni. */
        int missingCount,
        /** Yetishmayotgan ingredientlar (bo'sh bo'lsa — hammasi yetarli). */
        List<MissingMaterial> missing
) {
    public static CraftableItemDto from(CraftItem item, int maxCraftable, boolean fully,
                                        double completeness, int totalIngredients, List<MissingMaterial> missing) {
        return CraftableItemDto.builder()
                .resultItemId(item.getId())
                .resultItemName(item.getName())
                .resultItemNameUz(item.getNameUz())
                .resultItemNameEn(item.getNameEn())
                .resultItemNameUzCyr(item.getNameUzCyr())
                .categoryCode(item.getCategory().getCode())
                .imageUrl(item.getImageUrl())
                .maxCraftable(maxCraftable)
                .fullyCraftable(fully)
                .completeness(completeness)
                .totalIngredients(totalIngredients)
                .missingCount(missing.size())
                .missing(missing)
                .build();
    }

    /** Yetishmayotgan ingredient: nechta kerak va foydalanuvchida nechta bor. */
    @Builder
    public record MissingMaterial(
            Long itemId,
            String name,
            String nameUz,
            String nameEn,
            String nameUzCyr,
            BigDecimal required,
            BigDecimal have
    ) {
        public static MissingMaterial from(CraftItem item, BigDecimal required, BigDecimal have) {
            return MissingMaterial.builder()
                    .itemId(item.getId())
                    .name(item.getName())
                    .nameUz(item.getNameUz())
                    .nameEn(item.getNameEn())
                    .nameUzCyr(item.getNameUzCyr())
                    .required(required)
                    .have(have)
                    .build();
        }
    }
}
