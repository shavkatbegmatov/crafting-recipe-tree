package com.crafttree.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UploadsManifestDto {
    private String uploadsAbsolutePath;
    private int totalCount;
    private int presentCount;
    private int missingCount;
    private long totalBytes;
    private List<UploadEntry> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UploadEntry {
        private Long itemId;
        private String itemName;
        private String imageUrl;
        private String filename;
        private boolean exists;
        private Long sizeBytes;
    }
}
