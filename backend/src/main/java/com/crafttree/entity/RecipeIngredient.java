package com.crafttree.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "recipe_ingredients",
       uniqueConstraints = @UniqueConstraint(
           name = "uq_recipe_ingredients_recipe_ingredient",
           columnNames = {"recipe_id", "ingredient_item_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "recipe_id", nullable = false)
    private Recipe recipe;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "ingredient_item_id", nullable = false)
    private CraftItem ingredientItem;

    @Column(nullable = false, precision = 10, scale = 4)
    private BigDecimal quantity;
}
