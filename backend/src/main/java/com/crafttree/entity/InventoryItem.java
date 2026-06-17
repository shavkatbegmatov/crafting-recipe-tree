package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

/**
 * Foydalanuvchi inventaridagi bitta material (item + miqdor).
 * Bir foydalanuvchi-item juftligi bir marta — {@code uq_user_inventory} bilan majburlanadi.
 */
@Entity
@Table(name = "user_inventory")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "craft_item_id", nullable = false)
    private CraftItem item;

    @Column(nullable = false)
    private Integer quantity;
}
