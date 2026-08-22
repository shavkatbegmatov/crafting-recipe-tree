package com.crafttree.util;

import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
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

    /**
     * Kirill -> lotin. Bu shart, chunki loyihadagi nomlarning aksariyati ruscha:
     * translitersiz ularning hammasi {@code item}, {@code item-2}, {@code item-3}
     * kabi mazmunsiz kalit olardi.
     * <p>
     * Maqsad — o'qiladigan va barqaror kalit, filologik aniqlik emas.
     */
    private static final Map<Character, String> CYRILLIC = Map.ofEntries(
            Map.entry('а', "a"), Map.entry('б', "b"), Map.entry('в', "v"), Map.entry('г', "g"),
            Map.entry('д', "d"), Map.entry('е', "e"), Map.entry('ё', "e"), Map.entry('ж', "zh"),
            Map.entry('з', "z"), Map.entry('и', "i"), Map.entry('й', "y"), Map.entry('к', "k"),
            Map.entry('л', "l"), Map.entry('м', "m"), Map.entry('н', "n"), Map.entry('о', "o"),
            Map.entry('п', "p"), Map.entry('р', "r"), Map.entry('с', "s"), Map.entry('т', "t"),
            Map.entry('у', "u"), Map.entry('ф', "f"), Map.entry('х', "h"), Map.entry('ц', "ts"),
            Map.entry('ч', "ch"), Map.entry('ш', "sh"), Map.entry('щ', "sch"), Map.entry('ъ', ""),
            Map.entry('ы', "y"), Map.entry('ь', ""), Map.entry('э', "e"), Map.entry('ю', "yu"),
            Map.entry('я', "ya"),
            // O'zbek kirillidagi qo'shimcha harflar
            Map.entry('қ', "q"), Map.entry('ғ', "g"), Map.entry('ҳ', "h"), Map.entry('ў', "o")
    );

    private ItemKeys() {
    }

    /** Nomdan o'qiladigan slug: {@code "Iron Plate"} → {@code "iron-plate"}, {@code "Кремний"} → {@code "kremniy"}. */
    public static String slug(String raw) {
        if (raw == null || raw.isBlank()) {
            return "item";
        }
        String lower = raw.toLowerCase(Locale.ROOT);

        StringBuilder latin = new StringBuilder(lower.length());
        for (int i = 0; i < lower.length(); i++) {
            char c = lower.charAt(i);
            String mapped = CYRILLIC.get(c);
            latin.append(mapped != null ? mapped : c);
        }

        // Qolgan diakritikalarni tushiramiz (masalan "é" -> "e").
        String ascii = Normalizer.normalize(latin.toString(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String slug = ascii
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        if (slug.isBlank()) {
            // Lotin harflari umuman qolmadi (masalan faqat ieroglif yoki belgilar).
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
