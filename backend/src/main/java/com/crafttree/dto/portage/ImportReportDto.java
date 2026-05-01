package com.crafttree.dto.portage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImportReportDto {

    private boolean dryRun;

    private ImportManifestSummaryDto manifest;

    private SectionSummaryDto categories;
    private SectionSummaryDto tags;
    private SectionSummaryDto items;
    private SectionSummaryDto recipes;
    private SectionSummaryDto images;

    @Builder.Default
    private List<RowDto> categoryRows = new ArrayList<>();
    @Builder.Default
    private List<RowDto> tagRows = new ArrayList<>();
    @Builder.Default
    private List<RowDto> itemRows = new ArrayList<>();
    @Builder.Default
    private List<RowDto> imageRows = new ArrayList<>();

    @Builder.Default
    private List<String> warnings = new ArrayList<>();
    @Builder.Default
    private List<String> errors = new ArrayList<>();

    public enum Action {
        CREATE,
        UPDATE,
        REPLACE,
        SKIP,
        UNCHANGED,
        FAIL
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SectionSummaryDto {
        private int total;
        private int created;
        private int updated;
        private int unchanged;
        private int skipped;
        private int failed;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RowDto {
        private String identifier;
        private Action action;
        private String detail;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImportManifestSummaryDto {
        private String formatVersion;
        private String generator;
        private String exportedAt;
        private String selection;
        private int categoriesCount;
        private int tagsCount;
        private int itemsCount;
        private int recipeRowsCount;
        private int imagesCount;
    }
}
