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

    List<RecipeIngredient> findByRecipeId(Long recipeId);

    /**
     * Find all ingredient rows where the given item is used as an ingredient,
     * scoped to a specific game version (i.e. only rows that belong to recipes of that version).
     */
    @Query("""
            SELECT ri FROM RecipeIngredient ri
            WHERE ri.ingredientItem.id = :ingredientItemId
              AND ri.recipe.gameVersion.id = :gameVersionId
            """)
    List<RecipeIngredient> findByIngredientItemIdAndGameVersionId(
            @Param("ingredientItemId") Long ingredientItemId,
            @Param("gameVersionId") Long gameVersionId);

    Optional<RecipeIngredient> findByRecipeIdAndIngredientItemId(Long recipeId, Long ingredientItemId);

    /**
     * Ingredient qatorini qo'shadi yoki miqdorini yangilaydi.
     * <p>
     * {@code game_version_id} ATAYLAB parametr emas — u retseptning o'zidan olinadi.
     * Bu ustun NOT NULL va kompozit tashqi kalitlar orqali "retsept, ingredient va item
     * bir versiyada" qoidasini ushlab turadi; chaqiruvchidan so'ralsa noto'g'ri versiya
     * uzatilishi mumkin edi.
     * <p>
     * Bu native so'rov JPA hodisalarini chetlab o'tadi, ya'ni
     * {@code RecipeIngredient.syncGameVersion()} bu yerda ISHLAMAYDI — shuning uchun
     * ustun shu yerda to'ldirilishi shart.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO recipe_ingredients (recipe_id, ingredient_item_id, quantity, game_version_id)
            SELECT :recipeId, :ingredientItemId, :quantity, r.game_version_id
              FROM recipes r WHERE r.id = :recipeId
            ON CONFLICT (recipe_id, ingredient_item_id)
            DO UPDATE SET quantity = EXCLUDED.quantity
            """, nativeQuery = true)
    int upsert(@Param("recipeId") Long recipeId,
               @Param("ingredientItemId") Long ingredientItemId,
               @Param("quantity") BigDecimal quantity);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "DELETE FROM recipe_ingredients WHERE recipe_id = :recipeId", nativeQuery = true)
    int deleteAllByRecipeId(@Param("recipeId") Long recipeId);
}
