package com.crafttree.service;

import com.crafttree.dto.AdminChatMessageDto;
import com.crafttree.dto.ChatAnnouncementDto;
import com.crafttree.dto.ChatStatsDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.entity.ChatAnnouncement;
import com.crafttree.entity.ChatMessage;
import com.crafttree.entity.User;
import com.crafttree.exception.ItemNotFoundException;
import com.crafttree.repository.ChatAnnouncementRepository;
import com.crafttree.repository.ChatMessageRepository;
import com.crafttree.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Chat moderatsiyasi (super-admin): xabarlarni ko'rish/qidirish/o'chirish, foydalanuvchini
 * mute qilish, statistika va pin qilingan e'lon. O'chirish va e'lon o'zgarishlari real-vaqtda
 * {@code /topic/chat.deleted} va {@code /topic/chat.announcement} orqali e'lon qilinadi.
 */
@Service
@RequiredArgsConstructor
public class ChatModerationService {

    public static final String TOPIC_DELETED = "/topic/chat.deleted";
    public static final String TOPIC_ANNOUNCEMENT = "/topic/chat.announcement";
    private static final int PERMANENT_MUTE_YEARS = 100;

    private final ChatMessageRepository chatRepo;
    private final ChatAnnouncementRepository announcementRepo;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messaging;
    private final ChatPresenceService presenceService;

    // ── Xabarlar ──

    @Transactional(readOnly = true)
    public PagedResponse<AdminChatMessageDto> listMessages(String search, String username, int page, int size) {
        String q = (search == null) ? "" : search.trim().toLowerCase();
        String user = (username == null || username.isBlank()) ? null : username.trim();
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<ChatMessage> result = chatRepo.search(q, user, pageable);
        return PagedResponse.from(result, AdminChatMessageDto::from);
    }

    @Transactional
    public void deleteMessage(Long id) {
        if (!chatRepo.existsById(id)) {
            throw new ItemNotFoundException(id);
        }
        chatRepo.deleteById(id);
        // Barcha ochiq chatlardan xabarni real-vaqtda olib tashlash uchun.
        messaging.convertAndSend(TOPIC_DELETED, Map.of("id", id));
    }

    // ── Mute ──

    /** Foydalanuvchini mute qiladi. {@code durationMinutes} null/0 — doimiy. */
    @Transactional
    public void muteUser(Long userId, Integer durationMinutes) {
        User u = userRepository.findById(userId).orElseThrow(() -> new ItemNotFoundException(userId));
        LocalDateTime until = (durationMinutes == null || durationMinutes <= 0)
                ? LocalDateTime.now().plusYears(PERMANENT_MUTE_YEARS)
                : LocalDateTime.now().plusMinutes(durationMinutes);
        u.setChatMutedUntil(until);
        userRepository.save(u);
    }

    @Transactional
    public void unmuteUser(Long userId) {
        User u = userRepository.findById(userId).orElseThrow(() -> new ItemNotFoundException(userId));
        u.setChatMutedUntil(null);
        userRepository.save(u);
    }

    // ── Statistika ──

    @Transactional(readOnly = true)
    public ChatStatsDto stats() {
        long total = chatRepo.count();
        long today = chatRepo.countByCreatedAtAfter(LocalDate.now().atStartOfDay());
        int online = presenceService.snapshot().count();
        List<ChatStatsDto.TopSender> top = chatRepo.topSenders(PageRequest.of(0, 5)).stream()
                .map(r -> new ChatStatsDto.TopSender((String) r[0], (Long) r[1]))
                .toList();
        return ChatStatsDto.builder()
                .totalMessages(total)
                .todayMessages(today)
                .onlineCount(online)
                .topSenders(top)
                .build();
    }

    // ── E'lon ──

    @Transactional(readOnly = true)
    public ChatAnnouncementDto getAnnouncement() {
        return announcementRepo.findFirstByOrderByCreatedAtDesc().map(ChatAnnouncementDto::from).orElse(null);
    }

    @Transactional
    public ChatAnnouncementDto setAnnouncement(String message, String authorUsername) {
        ChatAnnouncement a = ChatAnnouncement.builder()
                .message(message.trim())
                .authorUsername(authorUsername)
                .build();
        announcementRepo.save(a);
        ChatAnnouncementDto dto = ChatAnnouncementDto.from(a);
        messaging.convertAndSend(TOPIC_ANNOUNCEMENT, dto);
        return dto;
    }

    @Transactional
    public void clearAnnouncement() {
        announcementRepo.deleteAll();
        // Bo'sh (message=null) e'lon — frontend uni yashiradi.
        messaging.convertAndSend(TOPIC_ANNOUNCEMENT, new ChatAnnouncementDto(null, null, null));
    }
}
