package com.crafttree.dto;

import jakarta.validation.constraints.Size;

/**
 * Arizani tasdiqlash yoki rad etish so'rovi. Izoh ixtiyoriy — super-admin qaror sababini
 * yozib qoldirishi mumkin (foydalanuvchiga ko'rinadi).
 */
public record ReviewAccessRequestRequest(
        @Size(max = 500, message = "Note is too long") String note
) {}
