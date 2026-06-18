package com.crafttree.dto;

/** Reaksiya qo'shish/olib tashlash so'rovi (STOMP /app/chat.react) — toggle. */
public record ChatReactionRequest(Long messageId, String emoji) {
}
