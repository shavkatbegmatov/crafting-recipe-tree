package com.crafttree.dto;

import lombok.Builder;

import java.util.List;

/** Bir versiyadan boshqasiga nusxa olish natijasi. */
@Builder
public record VersionCopyResultDto(
        String sourceVersion,
        String targetVersion,
        /** Yangi yaratilgan itemlar. */
        int itemsCopied,
        /** Maqsad versiyada allaqachon mavjud bo'lgani uchun tegilmagan itemlar. */
        int itemsSkipped,
        int recipesCopied,
        int recipesSkipped,
        /** Diqqat talab qiladigan holatlar (masalan ingredienti yetishmagan retsept). */
        List<String> warnings
) {
}
