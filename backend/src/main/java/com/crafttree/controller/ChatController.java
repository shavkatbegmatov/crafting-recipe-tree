package com.crafttree.controller;

import com.crafttree.dto.AttachmentDto;
import com.crafttree.dto.ChatAnnouncementDto;
import com.crafttree.dto.ChatEditRequest;
import com.crafttree.dto.ChatIdRequest;
import com.crafttree.dto.ChatMessageDto;
import com.crafttree.dto.ChatReactionRequest;
import com.crafttree.dto.ChatReactionUpdate;
import com.crafttree.dto.ChatSendRequest;
import com.crafttree.dto.PresenceDto;
import com.crafttree.dto.ReactionGroupDto;
import com.crafttree.entity.ChatAttachment;
import com.crafttree.entity.ChatMessage;
import com.crafttree.entity.ChatMessageReaction;
import com.crafttree.entity.NotificationType;
import com.crafttree.entity.User;
import com.crafttree.repository.ChatAttachmentRepository;
import com.crafttree.repository.ChatMessageReactionRepository;
import com.crafttree.repository.ChatMessageRepository;
import com.crafttree.repository.UserRepository;
import com.crafttree.service.ChatModerationService;
import com.crafttree.service.NotificationService;
import com.crafttree.service.ChatPresenceService;
import com.crafttree.service.RateLimiterService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.security.Principal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
    private final ChatMessageReactionRepository reactionRepo;
    private final NotificationService notificationService;
    private final ChatAttachmentRepository attachmentRepo;

    /** Chat spam himoyasi: bitta foydalanuvchidan daqiqasiga maksimal xabar. */
    private static final int CHAT_BURST = 15;
    private static final Duration CHAT_WINDOW = Duration.ofMinutes(1);

    /** Ulanma cheklovlari: faqat rasm turlari, maksimal 5 MB. */
    private static final Set<String> ALLOWED_ATTACHMENT_TYPES =
            Set.of("image/png", "image/jpeg", "image/gif", "image/webp");
    private static final long MAX_ATTACHMENT_BYTES = 5L * 1024 * 1024;

    /**
     * REST: Fetch the last N chat messages (for initial load / scrollback).
     * Returned in chronological order (oldest first).
     */
    @GetMapping("/api/chat/messages")
    @Operation(summary = "Get recent chat messages")
    public List<ChatMessageDto> getMessages(
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(required = false) Long before) {

        limit = Math.min(limit, 200); // cap
        var pageReq = PageRequest.of(0, limit);
        // before berilsa — undan eski xabarlar (infinite-scroll yuqoriga); aks holda — eng so'nggilari.
        var page = (before != null)
                ? chatRepo.findByIdLessThanOrderByCreatedAtDesc(before, pageReq)
                : chatRepo.findAllByOrderByCreatedAtDesc(pageReq);
        // getContent() o'zgarmas (immutable) ro'yxat qaytaradi — reverse() uni o'zgartira olishi
        // uchun mutable nusxaga olamiz (aks holda 2+ xabarda UnsupportedOperationException).
        List<ChatMessageDto> msgs = new ArrayList<>(page.map(ChatMessageDto::from).getContent());

        // Repo returns DESC; reverse to chronological order for the client
        Collections.reverse(msgs);
        return msgs;
    }

    /**
     * REST: Xabarlarni matn bo'yicha qidirish (eng yangi birinchi).
     * Natija xronologik tartiblanmaydi — qidiruv ro'yxati sifatida ko'rsatiladi.
     */
    @GetMapping("/api/chat/search")
    @Operation(summary = "Chat xabarlarini matn bo'yicha qidirish")
    public List<ChatMessageDto> searchMessages(
            @RequestParam String q,
            @RequestParam(defaultValue = "30") int limit) {

        if (q == null || q.isBlank()) {
            return List.of();
        }
        limit = Math.min(Math.max(limit, 1), 100);
        return chatRepo.searchByContent(q.trim(), PageRequest.of(0, limit))
                .map(ChatMessageDto::from)
                .getContent();
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
     * REST: Rasm yuklash. STOMP multipart yubora olmaydi — avval shu yerga yuklanib,
     * qaytgan id keyin {@code /app/chat.send}da {@code attachmentId} sifatida ulanadi.
     */
    @PostMapping("/api/chat/upload")
    @Operation(summary = "Chat ulanmasini (rasm) yuklash")
    public ResponseEntity<AttachmentDto> upload(@RequestParam("file") MultipartFile file, Principal principal) {
        User user = extractUser(principal);
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (file.getSize() > MAX_ATTACHMENT_BYTES) {
            return ResponseEntity.status(413).build(); // Payload Too Large
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_ATTACHMENT_TYPES.contains(contentType)) {
            return ResponseEntity.status(415).build(); // Unsupported Media Type
        }
        try {
            ChatAttachment a = ChatAttachment.builder()
                    .filename(sanitizeFilename(file.getOriginalFilename()))
                    .contentType(contentType)
                    .sizeBytes(file.getSize())
                    .data(file.getBytes())
                    .uploadedBy(user)
                    .build();
            attachmentRepo.save(a);
            return ResponseEntity.ok(AttachmentDto.from(a));
        } catch (IOException e) {
            log.warn("Attachment upload failed", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /** REST: Ulanmani ko'rsatish/yuklab olish. Brauzer keshlashi uchun uzoq muddatli cache. */
    @GetMapping("/api/chat/attachment/{id}")
    @Operation(summary = "Chat ulanmasini olish")
    public ResponseEntity<byte[]> attachment(@PathVariable Long id) {
        return attachmentRepo.findById(id)
                .map(a -> ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(a.getContentType()))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + a.getFilename() + "\"")
                        .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                        .body(a.getData()))
                .orElseGet(() -> ResponseEntity.notFound().build());
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

        String text = request.getContent() == null ? "" : request.getContent().trim();
        boolean hasAttachment = request.getAttachmentId() != null;
        // Matnsiz xabarga faqat ulanma bo'lsa ruxsat; juda uzun matn — rad etiladi.
        if ((text.isEmpty() && !hasAttachment) || text.length() > 2000) {
            return;
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
                .content(text);
        // Reply — javob berilayotgan xabar (mavjud bo'lsa) bog'lanadi.
        if (request.getReplyToId() != null) {
            chatRepo.findById(request.getReplyToId()).ifPresent(builder::replyTo);
        }
        // Ulanma — oldindan yuklangan fayl (mavjud bo'lsa) bog'lanadi.
        if (hasAttachment) {
            attachmentRepo.findById(request.getAttachmentId()).ifPresent(builder::attachment);
        }
        ChatMessage entity = builder.build();
        chatRepo.save(entity);

        ChatMessageDto dto = ChatMessageDto.from(entity);
        messaging.convertAndSend("/topic/chat", dto);
        notifyMentions(text, fresh);
        log.debug("Chat from {}: {}", fresh.getUsername(), text);
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

    /**
     * Emoji reaksiya qo'shadi yoki olib tashlaydi (toggle). Yangilangan guruhlar
     * {@code /topic/chat.reaction}ga real-vaqtda tarqatiladi.
     */
    @MessageMapping("/chat.react")
    @Transactional
    public void toggleReaction(@Payload ChatReactionRequest req, Principal principal) {
        User user = extractUser(principal);
        if (user == null || req == null || req.messageId() == null
                || req.emoji() == null || req.emoji().isBlank()) {
            return;
        }
        String emoji = req.emoji().trim();
        if (emoji.length() > 16 || !chatRepo.existsById(req.messageId())) {
            return;
        }
        reactionRepo.findByMessageIdAndUserIdAndEmoji(req.messageId(), user.getId(), emoji)
                .ifPresentOrElse(reactionRepo::delete, () -> {
                    ChatMessage msg = chatRepo.getReferenceById(req.messageId());
                    reactionRepo.save(ChatMessageReaction.builder()
                            .message(msg).user(user).emoji(emoji).build());
                });
        reactionRepo.flush();

        List<ReactionGroupDto> groups =
                ChatMessageDto.groupReactions(reactionRepo.findByMessageId(req.messageId()));
        messaging.convertAndSend("/topic/chat.reaction", new ChatReactionUpdate(req.messageId(), groups));
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

    // ── @mention ──

    // @ oldidan harf/raqam/_ bo'lmasligi shart (email manzili @mention bo'lib qolmasligi uchun).
    private static final Pattern MENTION_PATTERN = Pattern.compile("(?<![A-Za-z0-9_])@([A-Za-z0-9_]{1,50})");

    /** Xabar matnidan @username eslatmalarini ajratib oladi (takrorsiz, tartib saqlangan). */
    static Set<String> extractMentions(String content) {
        // Har doim o'zgartirilishi mumkin (mutable) to'plam qaytariladi — chaqiruvchi remove() qila oladi.
        Set<String> usernames = new LinkedHashSet<>();
        if (content == null || content.indexOf('@') < 0) {
            return usernames;
        }
        Matcher m = MENTION_PATTERN.matcher(content);
        while (m.find()) {
            usernames.add(m.group(1));
        }
        return usernames;
    }

    /** Eslatilgan (mavjud, faol, o'zi bo'lmagan) foydalanuvchilarga bildirishnoma yuboradi. */
    private void notifyMentions(String content, User sender) {
        Set<String> usernames = extractMentions(content);
        // extractMentions @ bo'lmasa Set.of() (o'zgarmas) qaytaradi — remove() chaqirsak
        // UnsupportedOperationException bo'lardi, shuning uchun avval bo'sh-tekshiruv.
        if (usernames.isEmpty()) {
            return;
        }
        usernames.remove(sender.getUsername());
        if (usernames.isEmpty()) {
            return;
        }
        for (User u : userRepository.findByUsernameIn(usernames)) {
            if (u.isEnabled()) {
                notificationService.notifyUser(u, NotificationType.CHAT_MENTION, sender.getUsername(), "/");
            }
        }
    }

    /** Fayl nomini xavfsiz holatga keltiradi (yo'l/maxsus belgilarsiz, 255 belgigacha). */
    private static String sanitizeFilename(String name) {
        if (name == null || name.isBlank()) {
            return "file";
        }
        String cleaned = name.replaceAll("[^A-Za-z0-9._-]", "_");
        return cleaned.length() > 255 ? cleaned.substring(0, 255) : cleaned;
    }
}
