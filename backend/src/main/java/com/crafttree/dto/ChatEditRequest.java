package com.crafttree.dto;

/** Chat xabarini tahrirlash so'rovi (STOMP /app/chat.edit). */
public record ChatEditRequest(Long id, String content) {
}
