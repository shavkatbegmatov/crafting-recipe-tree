package com.crafttree.repository;

import com.crafttree.entity.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecipeRepository extends JpaRepository<Recipe, Long> {

    Optional<Recipe> findByResultItemIdAndGameVersionId(Long resultItemId, Long gameVersionId);

    List<Recipe> findByResultItemIdOrderByGameVersionReleasedAtDesc(Long resultItemId);

    List<Recipe> findByGameVersionId(Long gameVersionId);

    boolean existsByGameVersionId(Long gameVersionId);

    void deleteByResultItemIdAndGameVersionId(Long resultItemId, Long gameVersionId);
}
