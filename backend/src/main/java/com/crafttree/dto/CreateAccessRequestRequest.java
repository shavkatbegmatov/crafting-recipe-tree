package com.crafttree.dto;

import jakarta.validation.constraints.Size;

/**
 * Admin huquqini so'rash arizasini yaratish so'rovi. Izoh ixtiyoriy — foydalanuvchi
 * nega admin bo'lmoqchiligini qisqacha yozishi mumkin.
 */
public record CreateAccessRequestRequest(
        @Size(max = 500, message = "Message is too long") String message
) {}
