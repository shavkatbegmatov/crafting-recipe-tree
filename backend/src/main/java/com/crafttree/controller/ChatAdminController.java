package com.crafttree.controller;

import com.crafttree.dto.AdminChatMessageDto;
import com.crafttree.dto.ChatAnnouncementDto;
import com.crafttree.dto.ChatModerationRequests.AnnouncementRequest;
import com.crafttree.dto.ChatModerationRequests.MuteRequest;
import com.crafttree.dto.ChatStatsDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.entity.User;
import com.crafttree.service.ChatModerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Chat moderatsiyasi API'si — faqat SUPER_ADMIN. {@code /api/admin/**} ostida bo'lgani uchun
 * SecurityConfig ADMIN talab qiladi; quyidagi {@code @PreAuthorize} uni SUPER_ADMIN'gacha toraytiradi.
 */
@RestController
@RequestMapping("/api/admin/chat")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SUPER_ADMIN')")
@Tag(name = "Chat Moderation", description = "Chatni boshqarish (super-admin)")
public class ChatAdminController {

    private final ChatModerationService moderationService;

    @GetMapping("/messages")
    @Operation(summary = "Xabarlar ro'yxati — qidiruv va foydalanuvchi filtri bilan")
    public PagedResponse<AdminChatMessageDto> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "30") int size) {
        return moderationService.listMessages(search, username, page, size);
    }

    @DeleteMapping("/messages/{id}")
    @Operation(summary = "Xabarni o'chirish (real-vaqtda barcha chatlardan)")
    public Map<String, Object> delete(@PathVariable Long id) {
        moderationService.deleteMessage(id);
        return Map.of("ok", true, "id", id);
    }

    @PostMapping("/users/{id}/mute")
    @Operation(summary = "Foydalanuvchini mute qilish (durationMinutes null/0 — doimiy)")
    public Map<String, Object> mute(@PathVariable Long id, @RequestBody(required = false) MuteRequest request) {
        moderationService.muteUser(id, request != null ? request.durationMinutes() : null);
        return Map.of("ok", true);
    }

    @PostMapping("/users/{id}/unmute")
    @Operation(summary = "Foydalanuvchining mute'ini bekor qilish")
    public Map<String, Object> unmute(@PathVariable Long id) {
        moderationService.unmuteUser(id);
        return Map.of("ok", true);
    }

    @GetMapping("/stats")
    @Operation(summary = "Chat statistikasi")
    public ChatStatsDto stats() {
        return moderationService.stats();
    }

    @PostMapping("/announcement")
    @Operation(summary = "E'lon qo'yish (chat tepasiga pin)")
    public ChatAnnouncementDto setAnnouncement(@Valid @RequestBody AnnouncementRequest request,
                                               @AuthenticationPrincipal User actor) {
        return moderationService.setAnnouncement(request.message(), actor.getUsername());
    }

    @DeleteMapping("/announcement")
    @Operation(summary = "E'lonni olib tashlash")
    public Map<String, Object> clearAnnouncement() {
        moderationService.clearAnnouncement();
        return Map.of("ok", true);
    }
}
