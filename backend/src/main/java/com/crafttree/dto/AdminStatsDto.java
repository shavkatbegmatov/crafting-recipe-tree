package com.crafttree.dto;

import lombok.Builder;

import java.util.List;

/**
 * Admin boshqaruv paneli statistikasi: kontent, foydalanuvchilar va chat bo'yicha umumiy ko'rsatkichlar
 * hamda kategoriya bo'yicha item taqsimoti (grafik uchun).
 */
@Builder
public record AdminStatsDto(
        long totalItems,
        long totalCategories,
        long totalRecipes,
        long totalTags,
        long totalUsers,
        long admins,
        long superAdmins,
        long blockedUsers,
        long totalMessages,
        long todayMessages,
        long totalFavorites,
        long inventoryEntries,
        List<CategoryCount> itemsByCategory
) {
    /** Kategoriya bo'yicha item soni (bar-chart uchun). */
    @Builder
    public record CategoryCount(String code, long count) {
    }
}
