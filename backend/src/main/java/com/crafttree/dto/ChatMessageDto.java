package com.crafttree.dto;

import com.crafttree.entity.ChatMessage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChatMessageDto {

    private Long id;
    private String username;
    private String role;
    private String content;
    private LocalDateTime createdAt;

    public static ChatMessageDto from(ChatMessage entity) {
        return ChatMessageDto.builder()
                .id(entity.getId())
                .username(entity.getUser().getUsername())
                .role(entity.getUser().getRole())
                .content(entity.getContent())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
