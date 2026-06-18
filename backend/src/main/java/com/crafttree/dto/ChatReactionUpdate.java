package com.crafttree.dto;

import java.util.List;

/** Reaksiya o'zgargach real-vaqtda tarqatiladigan yangilanish (/topic/chat.reaction). */
public record ChatReactionUpdate(Long messageId, List<ReactionGroupDto> reactions) {
}
