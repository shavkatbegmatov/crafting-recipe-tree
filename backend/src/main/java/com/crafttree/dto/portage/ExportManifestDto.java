package com.crafttree.dto.portage;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExportManifestDto {

    public static final String CURRENT_FORMAT_VERSION = "1.0";

    private String formatVersion;

    private String generator;

    private OffsetDateTime exportedAt;

    private String selection;

    @Builder.Default
    private List<ImageEntryDto> images = new ArrayList<>();

    private int categoriesCount;
    private int tagsCount;
    private int itemsCount;
    private int recipeRowsCount;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImageEntryDto {
        private String filename;
        private long sizeBytes;
        private String sha256;
    }
}
