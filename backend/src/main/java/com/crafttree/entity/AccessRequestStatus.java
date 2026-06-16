package com.crafttree.entity;

import java.util.Set;

/**
 * "Admin huquqini so'rash" arizasi holatlari. DB'da {@code access_requests.status}
 * ustunida matn sifatida saqlanadi.
 * <p>
 * Oqim: PENDING → (super-admin) APPROVED yoki REJECTED; PENDING → (foydalanuvchi) CANCELLED.
 * Yakuniy holatlar (APPROVED/REJECTED/CANCELLED) qaytadan o'zgartirilmaydi.
 */
public final class AccessRequestStatus {

    /** Ko'rib chiqilmoqda — super-admin qaroriga kutilmoqda. */
    public static final String PENDING = "PENDING";

    /** Tasdiqlangan — foydalanuvchiga so'ralgan rol berilgan. */
    public static final String APPROVED = "APPROVED";

    /** Rad etilgan — rol berilmadi (sabab review_note'da bo'lishi mumkin). */
    public static final String REJECTED = "REJECTED";

    /** Foydalanuvchi tomonidan bekor qilingan. */
    public static final String CANCELLED = "CANCELLED";

    /** Holat filtri validatsiyasi uchun barcha qiymatlar. */
    public static final Set<String> ALL = Set.of(PENDING, APPROVED, REJECTED, CANCELLED);

    private AccessRequestStatus() {
        // utility klass — instansiya yaratilmaydi
    }
}
