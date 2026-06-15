package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Foydalanuvchining yuqori rol (hozircha ADMIN) so'rash arizasi.
 * <p>
 * Bir foydalanuvchida ayni vaqtda faqat bitta PENDING ariza bo'lishi mumkin — bu DB'dagi
 * partial unique indeks bilan ham, {@code AccessRequestService} biznes-tekshiruvi bilan ham
 * majburlanadi. Tarix saqlanishi uchun yakunlangan arizalar o'chirilmaydi.
 */
@Entity
@Table(name = "access_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccessRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Arizani yuborgan foydalanuvchi. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** So'ralayotgan rol (hozircha doimo {@link Role#ADMIN}). */
    @Column(name = "requested_role", nullable = false, length = 20)
    private String requestedRole;

    /** Ariza holati — qarang {@link AccessRequestStatus}. */
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = AccessRequestStatus.PENDING;

    /** Foydalanuvchining ixtiyoriy izohi (nega admin bo'lmoqchi). */
    @Column(columnDefinition = "TEXT")
    private String message;

    /** Arizani ko'rib chiqqan super-admin (PENDING bo'lsa null). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    /** Super-adminning ixtiyoriy javob izohi (ayniqsa rad etishda foydali). */
    @Column(name = "review_note", columnDefinition = "TEXT")
    private String reviewNote;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Ko'rib chiqilgan vaqt (PENDING bo'lsa null). */
    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (status == null) {
            status = AccessRequestStatus.PENDING;
        }
    }
}
