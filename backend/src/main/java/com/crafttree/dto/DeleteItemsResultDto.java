package com.crafttree.dto;

import java.util.List;

/**
 * Item o'chirish natijasi (yoki {@code dryRun} da — nima bo'lishining ko'rinishi).
 * <p>
 * O'chirish qaytarilmaydi, shuning uchun UI avval shu hisobotni ko'rsatadi: nima
 * o'chadi, nima rad etiladi va o'chirish yo'lida yana nimalar yo'qoladi.
 */
public record DeleteItemsResultDto(
        boolean dryRun,
        String version,
        int deleted,
        int blocked,
        List<Row> rows
) {
    /**
     * @param status       DELETABLE | BLOCKED
     * @param usedIn       item ingredient sifatida ishlatiladigan retseptlar (BLOCKED sababi)
     * @param favorites    o'chib ketadigan sevimli yozuvlari
     * @param inventory    o'chib ketadigan inventar yozuvlari
     * @param craftLogs    o'chib ketadigan kraft tarixi yozuvlari
     * @param ownRecipe    itemning o'z retsepti ham o'chadimi
     */
    public record Row(
            Long itemId,
            String name,
            String status,
            List<String> usedIn,
            long favorites,
            long inventory,
            long craftLogs,
            boolean ownRecipe
    ) {
        public static final String DELETABLE = "DELETABLE";
        public static final String BLOCKED = "BLOCKED";
    }
}
