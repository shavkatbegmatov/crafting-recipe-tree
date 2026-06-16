package com.crafttree.dto;

import com.crafttree.entity.AuditLog;
import lombok.Builder;

import java.time.LocalDateTime;

/** Audit jurnali yozuvining ko'rinishi. */
@Builder
public record AuditLogDto(
        Long id,
        String actorUsername,
        String action,
        String targetType,
        Long targetId,
        String summary,
        LocalDateTime createdAt
) {
    public static AuditLogDto from(AuditLog a) {
        return AuditLogDto.builder()
                .id(a.getId())
                .actorUsername(a.getActorUsername())
                .action(a.getAction())
                .targetType(a.getTargetType())
                .targetId(a.getTargetId())
                .summary(a.getSummary())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
