package com.crafttree.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageMappingSyncRequest {
    private List<Mapping> items;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Mapping {
        private Long itemId;
        private String imageUrl;
    }
}
