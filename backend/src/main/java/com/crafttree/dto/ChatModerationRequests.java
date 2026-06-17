package com.crafttree.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Chat moderatsiyasi so'rovlari. */
public final class ChatModerationRequests {

    /**
     * Foydalanuvchini mute qilish. {@code durationMinutes} null yoki 0 — doimiy mute;
     * aks holda shu daqiqaga mute qilinadi.
     */
    public record MuteRequest(Integer durationMinutes) {}

    /** E'lon matni. */
    public record AnnouncementRequest(
            @NotBlank(message = "Message is required")
            @Size(max = 500, message = "Message is too long")
            String message
    ) {}

    private ChatModerationRequests() {
    }
}
