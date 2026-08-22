package com.crafttree.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.function.Predicate;

/**
 * {@code craft_items.item_key} generatori.
 * <p>
 * Kalit versiyalar bo'ylab <b>barqaror</b> bo'lishi kerak: bir xil item turli
 * versiyalarda bir xil kalitga ega bo'ladi (nusxa olishda kalit o'zgarmaydi).
 * Shu sababli u nomdan hosil qilinadi, id'dan emas.
 */
public final class ItemKeys {

    private static final int MAX_LENGTH = 120;

    private ItemKeys() {
    }

    /** Nomdan o'qiladigan slug: {@code "Iron Plate"} → {@code "iron-plate"}. */
    public static String slug(String raw) {
        if (raw == null || raw.isBlank()) {
            return "item";
        }
        String ascii = Normalizer.normalize(raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String slug = ascii.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            // Kirill/boshqa yozuv — lotin harflari qolmadi.
            return "item";
        }
        return slug.length() > MAX_LENGTH ? slug.substring(0, MAX_LENGTH) : slug;
    }

    /**
     * Berilgan versiya ichida band bo'lmagan kalit qaytaradi: {@code iron}, band
     * bo'lsa {@code iron-2}, {@code iron-3}, ...
     *
     * @param taken kalit shu versiyada allaqachon ishlatilganini tekshiruvchi predikat
     */
    public static String unique(String rawName, Predicate<String> taken) {
        String base = slug(rawName);
        if (!taken.test(base)) {
            return base;
        }
        for (int i = 2; i < 10_000; i++) {
            String candidate = base + "-" + i;
            if (!taken.test(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("item_key uchun bo'sh variant topilmadi: " + base);
    }
}
