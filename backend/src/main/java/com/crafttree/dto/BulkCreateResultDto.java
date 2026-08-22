package com.crafttree.dto;

import java.util.List;

/**
 * Ommaviy qo'shish natijasi.
 * <p>
 * {@code dryRun} rejimida hech narsa yozilmaydi — foydalanuvchi avval nima bo'lishini
 * ko'radi. Bu muhim: 50 ta itemni qo'shib bo'lgandan keyin xatoni topish yomon.
 */
public record BulkCreateResultDto(
        boolean dryRun,
        String version,
        int willCreate,
        int duplicates,
        int invalid,
        List<Row> rows
) {
    /**
     * Bir qator natijasi.
     * <p>
     * {@code status} va {@code reason} — <b>kodlar</b>, tayyor matn emas: tarjimani UI
     * qiladi, aks holda ruscha interfeysda o'zbekcha xabar chiqib qolardi.
     *
     * @param status NEW | DUPLICATE | INVALID
     * @param reason sabab kodi (status NEW bo'lsa null)
     * @param detail sababga tegishli qiymat (masalan noma'lum kategoriya kodi)
     */
    public record Row(int line, String name, String categoryCode,
                      String status, String reason, String detail) {

        public static final String NEW = "NEW";
        public static final String DUPLICATE = "DUPLICATE";
        public static final String INVALID = "INVALID";

        /** Sabab kodlari — UI shu kalitlar bo'yicha tarjima qiladi. */
        public static final String EXISTS = "EXISTS";
        public static final String DUP_IN_LIST = "DUP_IN_LIST";
        public static final String NAME_EMPTY = "NAME_EMPTY";
        public static final String NAME_TOO_LONG = "NAME_TOO_LONG";
        public static final String CATEGORY_UNKNOWN = "CATEGORY_UNKNOWN";
        public static final String CATEGORY_MISSING = "CATEGORY_MISSING";
    }
}
