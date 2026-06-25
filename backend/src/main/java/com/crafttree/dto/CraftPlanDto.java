package com.crafttree.dto;

import com.crafttree.entity.CraftItem;
import lombok.Builder;

import java.math.BigDecimal;
import java.util.List;

/**
 * Kraft rejasi: qadam-baqadam nima yasash (dependency tartibida), inventardan ayirilgan
 * "sotib olish kerak" ro'yxati, ketma-ket va parallel (kritik yo'l) jami vaqt.
 */
@Builder
public record CraftPlanDto(
        Long targetItemId,
        String targetItemName,
        String targetItemNameUz,
        String targetItemNameEn,
        String targetItemNameUzCyr,
        int targetQuantity,
        /** Yasash qadamlari — dependency tartibida (chuqurroq oraliq itemlar avval). */
        List<CraftStep> steps,
        /** Xomashyo: nechta kerak, inventarda nechta bor, nechta sotib olish kerak. */
        List<ShoppingEntry> shoppingList,
        /** Hamma qadamlar ketma-ket bajarilsa jami vaqt (sekund). */
        int totalTimeSeconds,
        /** Parallel bajarilganda kritik yo'l vaqti (sekund). */
        int parallelTimeSeconds
) {
    /** Bitta yasash qadami: qaysi itemni nechta yasash va u qancha vaqt oladi. */
    @Builder
    public record CraftStep(
            int stepNumber,
            Long itemId,
            String name,
            String nameUz,
            String nameEn,
            String nameUzCyr,
            String categoryCode,
            String imageUrl,
            /** Bu itemdan jami nechta yasash kerak (target bo'yicha). */
            BigDecimal quantity,
            /** Shu qadamning kraft vaqti (quantity × bitta dona vaqti). */
            int timeSeconds
    ) {
        public static CraftStep from(CraftItem item, int stepNumber, BigDecimal quantity, int timeSeconds) {
            return CraftStep.builder()
                    .stepNumber(stepNumber)
                    .itemId(item.getId())
                    .name(item.getName())
                    .nameUz(item.getNameUz())
                    .nameEn(item.getNameEn())
                    .nameUzCyr(item.getNameUzCyr())
                    .categoryCode(item.getCategory().getCode())
                    .imageUrl(item.getImageUrl())
                    .quantity(quantity)
                    .timeSeconds(timeSeconds)
                    .build();
        }
    }

    /** Sotib olish ro'yxati elementi: kerak / bor / sotib olish kerak. */
    @Builder
    public record ShoppingEntry(
            Long itemId,
            String name,
            String nameUz,
            String nameEn,
            String nameUzCyr,
            String categoryCode,
            String imageUrl,
            BigDecimal needed,
            BigDecimal have,
            BigDecimal toProcure
    ) {
        public static ShoppingEntry from(CraftItem item, BigDecimal needed, BigDecimal have, BigDecimal toProcure) {
            return ShoppingEntry.builder()
                    .itemId(item.getId())
                    .name(item.getName())
                    .nameUz(item.getNameUz())
                    .nameEn(item.getNameEn())
                    .nameUzCyr(item.getNameUzCyr())
                    .categoryCode(item.getCategory().getCode())
                    .imageUrl(item.getImageUrl())
                    .needed(needed)
                    .have(have)
                    .toProcure(toProcure)
                    .build();
        }
    }
}
