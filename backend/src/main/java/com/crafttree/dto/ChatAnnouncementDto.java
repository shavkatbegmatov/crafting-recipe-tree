package com.crafttree.dto;

import com.crafttree.entity.ChatAnnouncement;
import lombok.Builder;

import java.time.LocalDateTime;

/** Chat e'loni ko'rinishi. */
@Builder
public record ChatAnnouncementDto(
        String message,
        String authorUsername,
        LocalDateTime createdAt
) {
    public static ChatAnnouncementDto from(ChatAnnouncement a) {
        return ChatAnnouncementDto.builder()
                .message(a.getMessage())
                .authorUsername(a.getAuthorUsername())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
