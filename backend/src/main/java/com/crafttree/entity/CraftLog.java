package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Kraft tarixi yozuvi: foydalanuvchi qaysi itemni nechta yasagani (inventardan
 * xomashyo ayirib). Har bir "bulk craft" amali bitta yozuv yaratadi.
 */
@Entity
@Table(name = "craft_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CraftLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "result_item_id", nullable = false)
    private CraftItem resultItem;

    @Column(name = "result_quantity", nullable = false)
    private Integer resultQuantity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "game_version_id")
    private GameVersion gameVersion;

    @Column(name = "crafted_at", nullable = false)
    private LocalDateTime craftedAt;

    @PrePersist
    void prePersist() {
        if (craftedAt == null) {
            craftedAt = LocalDateTime.now();
        }
    }
}
