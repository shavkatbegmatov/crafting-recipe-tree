package com.crafttree.dto;

import jakarta.validation.constraints.NotBlank;

/** Foydalanuvchi rolini o'zgartirish so'rovi. Qiymat Role.ALL ichida bo'lishi service'da tekshiriladi. */
public record UpdateUserRoleRequest(
        @NotBlank(message = "Role is required") String role
) {}
