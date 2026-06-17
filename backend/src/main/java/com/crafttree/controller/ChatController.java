package com.crafttree.controller;

import com.crafttree.dto.ChatAnnouncementDto;
import com.crafttree.dto.ChatEditRequest;
import com.crafttree.dto.ChatIdRequest;
import com.crafttree.dto.ChatMessageDto;
import com.crafttree.dto.ChatSendRequest;
import com.crafttree.dto.PresenceDto;
import com.crafttree.entity.ChatMessage;
import com.crafttree.entity.User;
import com.crafttree.repository.ChatMessageRepository;
import com.crafttree.repository.UserRepository;
import com.crafttree.service.ChatModerationService;
import com.crafttree.service.ChatPresenceService;
import com.crafttree.service.RateLimiterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@Tag(name = "Chat", description = "Real-time global chat")
public class ChatController {

    private final ChatMessageRepository chatRepo;
    private final SimpMessagingTemplate messaging;
    private final ChatPresenceService presenceService;
    private final UserRepository userRepository;
    private final ChatModerationService moderationService;
    private final RateLimiterService rateLimiter;

    /** Chat spam himoyasi: bitta foydalanuvchidan daqiqasiga maksimal xabar. */
    private static final int CHAT_BURST = 15;
    private static final Duration CHAT_WINDOW = Duration.ofMinutes(1);

    /**
     * REST: Fetch the last N chat messages (for initial load / scrollback).
     * Returned in chronological order (oldest first).
     */
    @GetMapping("/api/chat/messages")
    @Operation(summary = "Get recent chat messages")
    public List<ChatMessageDto> getMessages(
            @RequestParam(defaultValue = "50") int limit) {

        limit = Math.min(limit, 200); // cap
        // getContent() o'zgarmas (immutable) ro'yxat qaytaradi — reverse() uni o'zgartira olishi
        // uchun mutable nusxaga olamiz (aks holda 2+ xabarda UnsupportedOperationException).
        List<ChatMessageDto> msgs = new ArrayList<>(
                chatRepo.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit))
                        .map(ChatMessageDto::from)
                        .getContent());

        // Repo returns DESC; reverse to chronological order for the client
        Collections.reverse(msgs);
        return msgs;
    }

    /**
     * REST: Hozir chatda onlayn foydalanuvchilar (panel ochilganda boshlang'ich holat uchun).
     * Keyingi yangilanishlar {@code /topic/chat.presence} orqali real-vaqtda keladi.
     */
    @GetMapping("/api/chat/online")
    @Operation(summary = "Hozir chatda onlayn foydalanuvchilar")
    public PresenceDto online() {
        return presenceService.snapshot();
    }

    /** REST: Joriy pin qilingan e'lon (yo'q bo'lsa — 204). */
    @GetMapping("/api/chat/announcement")
    @Operation(summary = "Joriy chat e'loni")
    public ResponseEntity<ChatAnnouncementDto> announcement() {
        ChatAnnouncementDto a = moderationService.getAnnouncement();
        return (a != null) ? ResponseEntity.ok(a) : ResponseEntity.noContent().build();
    }

    /**
     * STOMP: Receive a message from an authenticated user and broadcast
     * it to all subscribers on /topic/chat.
     */
    @MessageMapping("/chat.send")
    @Transactional
    public void sendMessage(@Payload ChatSendRequest request, Principal principal) {
        if (principal == null) {
            log.warn("Unauthenticated user tried to send a chat message");
            return;
        }

        String content = request.getContent();
        if (content == null || content.isBlank() || content.length() > 2000) {
            return; // silently drop invalid
        }

        User user = extractUser(principal);
        if (user == null) {
            return;
        }

        // Mute tekshiruvi — foydalanuvchi sessiya davomida mute qilingan bo'lishi mumkin,
        // shuning uchun holatni DB'dan yangilab olamiz.
        User fresh = userRepository.findById(user.getId()).orElse(null);
        if (fresh == null) {
            return;
        }
        if (fresh.getChatMutedUntil() != null && fresh.getChatMutedUntil().isAfter(LocalDateTime.now())) {
            log.debug("Muted user {} tried to send a chat message", fresh.getUsername());
            return;
        }

        // Spam himoyasi — daqiqasiga cheklangan xabar (jim tashlanadi, mute kabi).
        if (!rateLimiter.tryAcquire("chat:" + fresh.getId(), CHAT_BURST, CHAT_WINDOW)) {
            log.debug("Rate-limited chat from {}", fresh.getUsername());
            return;
        }

        ChatMessage.ChatMessageBuilder builder = ChatMessage.builder()
                .user(fresh)
                .content(content.trim());
        // Reply — javob berilayotgan xabar (mavjud bo'lsa) bog'lanadi.
        if (request.getReplyToId() != null) {
            chatRepo.findById(request.getReplyToId()).ifPresent(builder::replyTo);
        }
        ChatMessage entity = builder.build();
        chatRepo.save(entity);

        ChatMessageDto dto = ChatMessageDto.from(entity);
        messaging.convertAndSend("/topic/chat", dto);
        log.debug("Chat from {}: {}", fresh.getUsername(), content.trim());
    }

    /** O'z xabarini tahrirlash. Faqat egasi; tahrirlangan vaqt belgilanib, real-vaqtda tarqatiladi. */
    @MessageMapping("/chat.edit")
    @Transactional
    public void editMessage(@Payload ChatEditRequest req, Principal principal) {
        User user = extractUser(principal);
        if (user == null || req == null || req.id() == null) {
            return;
        }
        String content = req.content();
        if (content == null || content.isBlank() || content.length() > 2000) {
            return;
        }
        ChatMessage msg = chatRepo.findById(req.id()).orElse(null);
        if (msg == null || !msg.getUser().getId().equals(user.getId())) {
            return; // faqat o'z xabarini tahrirlash mumkin
        }
        msg.setContent(content.trim());
        msg.setEditedAt(LocalDateTime.now());
        chatRepo.save(msg);
        messaging.convertAndSend("/topic/chat.edited", ChatMessageDto.from(msg));
    }

    /** O'z xabarini o'chirish (super-admin moderatsiyasidan farqli — bu faqat egasi uchun). */
    @MessageMapping("/chat.delete")
    @Transactional
    public void deleteOwnMessage(@Payload ChatIdRequest req, Principal principal) {
        User user = extractUser(principal);
        if (user == null || req == null || req.id() == null) {
            return;
        }
        ChatMessage msg = chatRepo.findById(req.id()).orElse(null);
        if (msg == null || !msg.getUser().getId().equals(user.getId())) {
            return;
        }
        chatRepo.delete(msg);
        messaging.convertAndSend("/topic/chat.deleted", Map.of("id", req.id()));
    }

    /** "Yozmoqda" signali — DB'ga yozilmaydi, faqat real-vaqtda boshqalarga ko'rsatiladi. */
    @MessageMapping("/chat.typing")
    public void typing(Principal principal) {
        User user = extractUser(principal);
        if (user != null) {
            messaging.convertAndSend("/topic/chat.typing", Map.of("username", user.getUsername()));
        }
    }

    private User extractUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken auth) {
            Object p = auth.getPrincipal();
            if (p instanceof User u) {
                return u;
            }
        }
        return null;
    }
}
