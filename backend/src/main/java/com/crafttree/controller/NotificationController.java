package com.crafttree.controller;

import com.crafttree.dto.NotificationDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.entity.User;
import com.crafttree.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Foydalanuvchining o'z bildirishnomalarini boshqarishi. Barcha endpointlar autentifikatsiya
 * talab qiladi (SecurityConfig'da {@code /api/notifications/** → authenticated}).
 */
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "Foydalanuvchi bildirishnomalari")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    @Operation(summary = "Mening bildirishnomalarim (so'nggidan eskisiga, sahifalangan)")
    public PagedResponse<NotificationDto> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return notificationService.list(user, page, size);
    }

    @GetMapping("/unread-count")
    @Operation(summary = "O'qilmagan bildirishnomalar soni (badge uchun)")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal User user) {
        return Map.of("count", notificationService.unreadCount(user));
    }

    @PostMapping("/{id}/read")
    @Operation(summary = "Bitta bildirishnomani o'qilgan deb belgilash")
    public Map<String, Object> markRead(@PathVariable Long id, @AuthenticationPrincipal User user) {
        notificationService.markRead(id, user);
        return Map.of("ok", true);
    }

    @PostMapping("/read-all")
    @Operation(summary = "Barcha bildirishnomalarni o'qilgan deb belgilash")
    public Map<String, Object> markAllRead(@AuthenticationPrincipal User user) {
        notificationService.markAllRead(user);
        return Map.of("ok", true);
    }
}
