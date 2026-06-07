package com.crafttree.entity;

import java.util.Set;

/**
 * Tizimdagi foydalanuvchi rollari. DB'da {@code users.role} ustunida matn sifatida saqlanadi.
 * <p>
 * Ierarxiya (qarang: {@code SecurityConfig#roleHierarchy}): SUPER_ADMIN &gt; ADMIN &gt; USER.
 * Ya'ni SUPER_ADMIN — ADMIN'ning, ADMIN esa USER'ning barcha huquqlarini meros qiladi.
 */
public final class Role {

    /** Oddiy foydalanuvchi — faqat o'qish va o'z profilini boshqarish. */
    public static final String USER = "USER";

    /** Administrator — kontent (item/category/tag/...) va oddiy foydalanuvchilarni boshqaradi. */
    public static final String ADMIN = "ADMIN";

    /** Super-administrator — rol tayinlay oladi va adminlarni ham boshqaradi. */
    public static final String SUPER_ADMIN = "SUPER_ADMIN";

    /** Tayinlash mumkin bo'lgan barcha rollar — qiymat validatsiyasi uchun. */
    public static final Set<String> ALL = Set.of(USER, ADMIN, SUPER_ADMIN);

    private Role() {
        // utility klass — instansiya yaratilmaydi
    }
}
