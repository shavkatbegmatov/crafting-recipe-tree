package com.crafttree.entity;

import java.util.Set;

/**
 * Foydalanuvchining sahifa kengligi sozlamasi (DB'da {@code users.layout_width} ustunida saqlanadi).
 * <ul>
 *   <li>{@code CENTERED} — kontent max-width bilan markazda (default).</li>
 *   <li>{@code FULL} — kontent butun mavjud kenglikni egallaydi.</li>
 * </ul>
 */
public final class LayoutWidth {

    public static final String CENTERED = "CENTERED";
    public static final String FULL = "FULL";

    /** Ruxsat etilgan barcha qiymatlar — validatsiya uchun. */
    public static final Set<String> ALL = Set.of(CENTERED, FULL);

    private LayoutWidth() {
        // utility klass
    }
}
