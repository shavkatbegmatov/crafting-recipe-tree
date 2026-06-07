package com.crafttree.dto;

import lombok.Builder;

/**
 * Foydalanuvchilar bo'yicha umumiy statistika (admin paneli kartalari uchun).
 */
@Builder
public record UserStatsDto(
        long total,
        long superAdmins,
        long admins,
        long users,
        long blocked
) {}
