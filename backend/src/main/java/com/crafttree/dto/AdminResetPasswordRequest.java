package com.crafttree.dto;

import jakarta.validation.constraints.Size;

/**
 * Admin tomonidan foydalanuvchiga yangi parol o'rnatish so'rovi.
 * newPassword ixtiyoriy: yuborilmasa (null) server tasodifiy vaqtinchalik parol hosil qiladi.
 * Berilsa — 6..100 belgi bo'lishi shart (bo'sh string ham rad etiladi).
 */
public record AdminResetPasswordRequest(
        @Size(min = 6, max = 100, message = "Password must be 6-100 characters")
        String newPassword
) {}
