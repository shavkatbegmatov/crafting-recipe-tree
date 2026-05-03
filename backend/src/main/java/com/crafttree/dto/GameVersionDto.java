package com.crafttree.dto;

import com.crafttree.entity.GameVersion;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GameVersionDto {
    private Long id;
    private String version;
    private LocalDateTime releasedAt;
    private String notes;
    private Boolean isCurrent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static GameVersionDto from(GameVersion gv) {
        return GameVersionDto.builder()
                .id(gv.getId())
                .version(gv.getVersion())
                .releasedAt(gv.getReleasedAt())
                .notes(gv.getNotes())
                .isCurrent(gv.getIsCurrent())
                .createdAt(gv.getCreatedAt())
                .updatedAt(gv.getUpdatedAt())
                .build();
    }
}
