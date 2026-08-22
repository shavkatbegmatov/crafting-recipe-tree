package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Kraft item — <b>bitta o'yin versiyasiga</b> tegishli.
 * <p>
 * Har bir versiya o'z item to'plamiga ega: nom, rasm va tavsif versiyaga qarab
 * mustaqil tahrirlanadi. Versiyalar bo'ylab "bu bir xil item" ekanini
 * {@link #itemKey} bildiradi — u nusxa olishda o'zgarmaydi.
 */
@Entity
@Table(name = "craft_items", uniqueConstraints = {
        @UniqueConstraint(name = "uq_craft_items_key_version", columnNames = {"item_key", "game_version_id"}),
        @UniqueConstraint(name = "uq_craft_items_name_version", columnNames = {"name", "game_version_id"}),
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CraftItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Nom versiya ichida unique (ilgari global unique edi). */
    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "name_uz", length = 100)
    private String nameUz;

    @Column(name = "name_en", length = 100)
    private String nameEn;

    @Column(name = "name_uz_cyr", length = 100)
    private String nameUzCyr;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_uz", columnDefinition = "TEXT")
    private String descriptionUz;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(name = "description_uz_cyr", columnDefinition = "TEXT")
    private String descriptionUzCyr;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    /**
     * Item shu o'yin versiyasiga tegishli. Yangi versiya bo'sh boshlanadi —
     * itemlar unga faqat nusxa olish orqali tushadi.
     */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "game_version_id", nullable = false)
    private GameVersion gameVersion;

    /**
     * Versiyalar bo'ylab barqaror identifikator (masalan {@code water-1}).
     * Nusxa olishda o'zgarmaydi — shu tufayli versiyani almashtirganda
     * foydalanuvchini o'sha itemning mos nusxasiga olib o'tish mumkin.
     */
    @Column(name = "item_key", nullable = false, length = 140)
    private String itemKey;

    @Column(name = "craft_time_seconds")
    private Integer craftTimeSeconds;

    @Column(name = "image_url")
    private String imageUrl;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "item_tags",
        joinColumns = @JoinColumn(name = "item_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    @Builder.Default
    private Set<Tag> tags = new HashSet<>();

    @OneToMany(mappedBy = "resultItem", fetch = FetchType.LAZY)
    @Builder.Default
    private List<Recipe> recipes = new ArrayList<>();

    @OneToMany(mappedBy = "ingredientItem", fetch = FetchType.LAZY)
    @Builder.Default
    private List<RecipeIngredient> usedIn = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
