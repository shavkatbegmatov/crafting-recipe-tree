package com.crafttree.dto;

import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageMappingSyncResultDto {
    private int totalSubmitted;
    private int updated;
    private int unchanged;
    private int notFound;
    private List<Long> notFoundIds;
}
