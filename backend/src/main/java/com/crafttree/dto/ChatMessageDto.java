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
    private LocalDateTime editedAt;
    private Long replyToId;
    private String replyToUsername;
    private String replyToContent;

    /** Diqqat: reply'ning LAZY user/content o'qilgani uchun tranzaksiya ichida chaqirilishi kerak. */
    public static ChatMessageDto from(ChatMessage entity) {
        ChatMessageDtoBuilder b = ChatMessageDto.builder()
                .id(entity.getId())
                .username(entity.getUser().getUsername())
                .role(entity.getUser().getRole())
                .content(entity.getContent())
                .createdAt(entity.getCreatedAt())
                .editedAt(entity.getEditedAt());
        ChatMessage r = entity.getReplyTo();
        if (r != null) {
            String c = r.getContent();
            b.replyToId(r.getId())
                    .replyToUsername(r.getUser().getUsername())
                    .replyToContent(c.length() > 80 ? c.substring(0, 80) + "…" : c);
        }
        return b.build();
    }
}
