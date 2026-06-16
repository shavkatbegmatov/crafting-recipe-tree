package com.crafttree.service;

import com.crafttree.dto.NotificationDto;
import com.crafttree.dto.PagedResponse;
import com.crafttree.entity.Notification;
import com.crafttree.entity.Role;
import com.crafttree.entity.User;
import com.crafttree.repository.NotificationRepository;
import com.crafttree.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Bildirishnomalarni yaratish, yetkazish va o'qish biznes-mantiqi.
 * <p>
 * Har bir bildirishnoma DB'ga saqlanadi (tarix/offline) va shu zahoti egasining shaxsiy
 * STOMP kanaliga ({@code /user/queue/notifications}) yuboriladi.
 */
@Service
@RequiredArgsConstructor
public class NotificationService {

    /** Eganing shaxsiy STOMP kanali (Spring {@code /user} prefiksi bilan birga). */
    public static final String USER_QUEUE = "/queue/notifications";

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messaging;

    // ── Yaratish / yetkazish ──

    /** Bitta foydalanuvchiga bildirishnoma: DB'ga saqlaydi va real-vaqtda push qiladi. */
    @Transactional
    public void notifyUser(User recipient, String type, String actorUsername, String link) {
        Notification n = Notification.builder()
                .recipient(recipient)
                .type(type)
                .actorUsername(actorUsername)
                .link(link)
                .build();
        notificationRepository.save(n);
        messaging.convertAndSendToUser(recipient.getUsername(), USER_QUEUE, NotificationDto.from(n));
    }

    /** Barcha super-adminlarga bir xil bildirishnoma (masalan, yangi ariza keldi). */
    @Transactional
    public void notifySuperAdmins(String type, String actorUsername, String link) {
        for (User admin : userRepository.findByRole(Role.SUPER_ADMIN)) {
            notifyUser(admin, type, actorUsername, link);
        }
    }

    // ── O'qish / belgilash ──

    @Transactional(readOnly = true)
    public PagedResponse<NotificationDto> list(User recipient, int page, int size) {
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100));
        Page<Notification> result = notificationRepository.findByRecipientOrderByCreatedAtDesc(recipient, pageable);
        return PagedResponse.from(result, NotificationDto::from);
    }

    @Transactional(readOnly = true)
    public long unreadCount(User recipient) {
        return notificationRepository.countByRecipientAndReadFalse(recipient);
    }

    /** Bitta bildirishnomani o'qilgan deb belgilaydi (faqat egasi). Topilmasa — jimgina o'tadi. */
    @Transactional
    public void markRead(Long id, User recipient) {
        notificationRepository.findByIdAndRecipient(id, recipient).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllRead(User recipient) {
        notificationRepository.markAllRead(recipient);
    }
}
