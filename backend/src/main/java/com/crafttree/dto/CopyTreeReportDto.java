package com.crafttree.dto;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CopyTreeReportDto {

    private String fromVersion;
    private String toVersion;
    private Long rootItemId;
    private String conflictPolicy;
    private boolean dryRun;

    /** Recipes written (newly created, or overwritten when policy = OVERWRITE_ALL). */
    @Builder.Default
    private List<Entry> copied = new ArrayList<>();

    /** Recipes that already existed in target and were left untouched (SKIP_EXISTING / FILL_GAPS_ONLY). */
    @Builder.Default
    private List<Entry> skipped = new ArrayList<>();

    /** Recipes that existed in target and were replaced (OVERWRITE_ALL). */
    @Builder.Default
    private List<Entry> overwritten = new ArrayList<>();

    /**
     * Items the traversal reached that have no recipe in the source version.
     * Includes RAW items and items where the source version simply has no recipe row.
     */
    @Builder.Default
    private List<Entry> missingInSource = new ArrayList<>();

    /** Total nodes visited during traversal (excluding cycle re-entries). */
    private int visited;

    /** True if the traversal hit MAX_DEPTH, so some deep branches may be incomplete. */
    private boolean maxDepthReached;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Entry {
        private Long itemId;
        private String itemName;
        /** Localized names so the UI can render without an extra lookup. */
        private String itemNameUz;
        private String itemNameEn;
        private String itemNameUzCyr;
        private String categoryCode;
        private String imageUrl;
        /** Source recipe id (null when item has no source recipe). */
        private Long sourceRecipeId;
    }
}
