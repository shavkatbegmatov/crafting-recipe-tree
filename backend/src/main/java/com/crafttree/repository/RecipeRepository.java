package com.crafttree.repository;

import com.crafttree.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    Optional<Recipe> findByResultItemIdAndGameVersionId(Long resultItemId, Long gameVersionId);

    List<Recipe> findByResultItemIdOrderByGameVersionReleasedAtDesc(Long resultItemId);

    List<Recipe> findByGameVersionId(Long gameVersionId);

    /**
     * Eagerly fetch every recipe + its ingredient rows + ingredient items for a single game version
     * in one query. Used by the bulk tree-copy operation to avoid N+1 lookups while traversing.
     */
    @Query("""
            SELECT DISTINCT r FROM Recipe r
            LEFT JOIN FETCH r.ingredients ri
            LEFT JOIN FETCH ri.ingredientItem
            WHERE r.gameVersion.id = :gameVersionId
            """)
    List<Recipe> findAllWithIngredientsByGameVersionId(@Param("gameVersionId") Long gameVersionId);

    boolean existsByGameVersionId(Long gameVersionId);

    void deleteByResultItemIdAndGameVersionId(Long resultItemId, Long gameVersionId);
}
