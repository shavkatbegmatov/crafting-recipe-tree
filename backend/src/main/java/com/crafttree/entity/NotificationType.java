package com.crafttree.entity;

/**
 * Bildirishnoma turlari. DB'da {@code notifications.type} ustunida matn sifatida saqlanadi.
 * <p>
 * Matn (sarlavha/tana) backend'da emas, frontend i18n'da shu tur bo'yicha render qilinadi —
 * shunda til almashtirilganda eski bildirishnomalar ham joriy tilda ko'rinadi.
 */
public final class NotificationType {

    /** Super-adminga: yangi "admin huquqi" arizasi keldi. */
    public static final String ACCESS_REQUEST_SUBMITTED = "ACCESS_REQUEST_SUBMITTED";

    /** Foydalanuvchiga: arizasi tasdiqlandi (admin bo'ldi). */
    public static final String ACCESS_REQUEST_APPROVED = "ACCESS_REQUEST_APPROVED";

    /** Foydalanuvchiga: arizasi rad etildi. */
    public static final String ACCESS_REQUEST_REJECTED = "ACCESS_REQUEST_REJECTED";

    /** Foydalanuvchiga: chat xabarida @username bilan eslatildi. */
    public static final String CHAT_MENTION = "CHAT_MENTION";

    private NotificationType() {
        // utility klass — instansiya yaratilmaydi
    }
}
