package com.crafttree.dto;

import lombok.Builder;

import java.util.List;

/** Bitta emoji bo'yicha reaksiyalar guruhi: emoji, soni va kim bosgani (frontend "men bosdimmi" uchun). */
@Builder
public record ReactionGroupDto(String emoji, int count, List<String> users) {
}
