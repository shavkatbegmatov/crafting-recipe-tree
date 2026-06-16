package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Foydalanuvchiga yo'naltirilgan bildirishnoma. Real-vaqtda WebSocket orqali yuboriladi va
 * shu bilan birga DB'da saqlanadi — shunda foydalanuvchi offline bo'lsa ham keyin ko'radi.
 * <p>
 * Sarlavha/tana matni bu yerda saqlanmaydi: faqat {@code type} va {@code actorUsername}
 * saqlanib, ko'rinish frontend i18n'da hosil qilinadi (til-mustaqil).
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Bildirishnoma egasi. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    /** Tur — qarang {@link NotificationType}. */
    @Column(nullable = false, length = 50)
    private String type;

    /** Voqeani keltirib chiqargan foydalanuvchi (masalan, ariza bergan yoki ko'rib chiqgan) — nullable. */
    @Column(name = "actor_username", length = 50)
    private String actorUsername;

    /** Bosilganda o'tiladigan frontend yo'li (masalan "/admin/access-requests") — nullable. */
    @Column(length = 300)
    private String link;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private boolean read = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
