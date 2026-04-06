package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "craft_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CraftItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
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
    private List<RecipeIngredient> ingredients = new ArrayList<>();

    @OneToMany(mappedBy = "ingredientItem", fetch = FetchType.LAZY)
    @Builder.Default
    private List<RecipeIngredient> usedIn = new ArrayList<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
