package com.crafttree.dto;

import com.crafttree.entity.ChatMessage;
import lombok.Builder;

import java.time.LocalDateTime;

/** Admin moderatsiyasi uchun chat xabari ko'rinishi (yuboruvchi ma'lumotlari bilan). */
@Builder
public record AdminChatMessageDto(
        Long id,
        Long userId,
        String username,
        String role,
        String content,
        LocalDateTime createdAt
) {
    public static AdminChatMessageDto from(ChatMessage m) {
        return AdminChatMessageDto.builder()
                .id(m.getId())
                .userId(m.getUser().getId())
                .username(m.getUser().getUsername())
                .role(m.getUser().getRole())
                .content(m.getContent())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
