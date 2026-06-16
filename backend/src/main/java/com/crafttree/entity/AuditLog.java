package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Audit jurnali yozuvi: kim, qachon, nima ustida qanday amal bajardi.
 * <p>
 * Foydalanuvchi nomi (entity emas) saqlanadi — actor keyin o'chirilsa ham tarix saqlanib qoladi.
 * Yozuvlar o'zgartirilmaydi/o'chirilmaydi (faqat qo'shiladi).
 */
@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Amalni bajargan foydalanuvchi nomi (tizim/anonim bo'lsa null). */
    @Column(name = "actor_username", length = 50)
    private String actorUsername;

    /** Amal turi — qarang {@link AuditAction}. */
    @Column(nullable = false, length = 40)
    private String action;

    /** Ob'ekt turi: "USER", "ACCESS_REQUEST", "CATEGORY", "ITEM", "TAG", "GAME_VERSION". */
    @Column(name = "target_type", nullable = false, length = 40)
    private String targetType;

    /** Ob'ekt identifikatori (mavjud bo'lsa). */
    @Column(name = "target_id")
    private Long targetId;

    /** Inson o'qiy oladigan qisqa tavsif (masalan, "USER bakir → ADMIN"). */
    @Column(length = 500)
    private String summary;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
