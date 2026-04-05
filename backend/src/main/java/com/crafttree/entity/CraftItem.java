package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

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

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "craft_time_seconds")
    private Integer craftTimeSeconds;

    @Column(name = "image_url")
    private String imageUrl;

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
