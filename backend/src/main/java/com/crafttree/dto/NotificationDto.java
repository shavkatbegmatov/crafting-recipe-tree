package com.crafttree.dto;

import com.crafttree.entity.Notification;
import lombok.Builder;

import java.time.LocalDateTime;

/**
 * Bildirishnoma ko'rinishi. Matn frontend i18n'da {@code type} (+ {@code actorUsername})
 * bo'yicha hosil qilinadi.
 */
@Builder
public record NotificationDto(
        Long id,
        String type,
        String actorUsername,
        String link,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationDto from(Notification n) {
        return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .actorUsername(n.getActorUsername())
                .link(n.getLink())
                .read(n.isRead())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
