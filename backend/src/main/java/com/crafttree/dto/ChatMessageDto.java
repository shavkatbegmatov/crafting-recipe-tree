package com.crafttree.dto;

import com.crafttree.entity.ChatMessage;
import com.crafttree.entity.ChatMessageReaction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
    private List<ReactionGroupDto> reactions;

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
        b.reactions(groupReactions(entity.getReactions()));
        return b.build();
    }

    /** Reaksiyalarni emoji bo'yicha guruhlaydi (emoji -> soni + kim bosgani). */
    public static List<ReactionGroupDto> groupReactions(Collection<ChatMessageReaction> reactions) {
        if (reactions == null || reactions.isEmpty()) {
            return List.of();
        }
        Map<String, List<String>> byEmoji = new LinkedHashMap<>();
        for (ChatMessageReaction r : reactions) {
            byEmoji.computeIfAbsent(r.getEmoji(), k -> new ArrayList<>()).add(r.getUser().getUsername());
        }
        return byEmoji.entrySet().stream()
                .map(e -> ReactionGroupDto.builder()
                        .emoji(e.getKey())
                        .count(e.getValue().size())
                        .users(e.getValue())
                        .build())
                .toList();
    }
}
