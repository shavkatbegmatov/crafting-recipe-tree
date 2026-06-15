package com.crafttree.dto;

import com.crafttree.entity.AccessRequest;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Super-admin paneli uchun ariza ko'rinishi: arizachining joriy roli, so'ralayotgan rol,
 * holat va ko'rib chiqish ma'lumotlari bilan.
 */
@Builder
public record AccessRequestDto(
        Long id,
        Long userId,
        String username,
        String displayName,
        /** Arizachining HOZIRGI roli (tasdiqlangach o'zgaradi). */
        String currentRole,
        String requestedRole,
        String status,
        String message,
        String reviewNote,
        String reviewedByUsername,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt
) {
    public static AccessRequestDto from(AccessRequest r) {
        return AccessRequestDto.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .username(r.getUser().getUsername())
                .displayName(r.getUser().getDisplayName())
                .currentRole(r.getUser().getRole())
                .requestedRole(r.getRequestedRole())
                .status(r.getStatus())
                .message(r.getMessage())
                .reviewNote(r.getReviewNote())
                .reviewedByUsername(r.getReviewedBy() != null ? r.getReviewedBy().getUsername() : null)
                .createdAt(r.getCreatedAt())
                .reviewedAt(r.getReviewedAt())
                .build();
    }
}
