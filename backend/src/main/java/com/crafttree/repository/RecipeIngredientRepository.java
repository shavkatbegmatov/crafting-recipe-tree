package com.crafttree.repository;

import com.crafttree.entity.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    List<RecipeIngredient> findByResultItemId(Long resultItemId);

    List<RecipeIngredient> findByIngredientItemId(Long ingredientItemId);

    Optional<RecipeIngredient> findByResultItemIdAndIngredientItemId(Long resultItemId, Long ingredientItemId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO recipe_ingredients (result_item_id, ingredient_item_id, quantity)
            VALUES (:resultItemId, :ingredientItemId, :quantity)
            ON CONFLICT (result_item_id, ingredient_item_id)
            DO UPDATE SET quantity = EXCLUDED.quantity
            """, nativeQuery = true)
    int upsert(@Param("resultItemId") Long resultItemId,
               @Param("ingredientItemId") Long ingredientItemId,
               @Param("quantity") BigDecimal quantity);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM recipe_ingredients WHERE result_item_id = :resultItemId", nativeQuery = true)
    int deleteAllByResultItemId(@Param("resultItemId") Long resultItemId);
}
