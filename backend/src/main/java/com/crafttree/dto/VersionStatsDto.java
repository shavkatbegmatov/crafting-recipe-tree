package com.crafttree.dto;

/**
 * Versiya bo'yicha to'ldirilganlik ko'rsatkichi.
 * <p>
 * Yangi versiya bo'sh boshlanadi, shuning uchun admin qaysi versiyada nima borligini
 * bir qarashda ko'ra olishi kerak — nusxa olish shu yerdan boshlanadi.
 */
public record VersionStatsDto(
        Long versionId,
        String version,
        boolean isCurrent,
        long itemCount,
        long recipeCount
) {
}
