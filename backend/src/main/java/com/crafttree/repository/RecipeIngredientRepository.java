package com.crafttree.repository;

import com.crafttree.entity.RecipeIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RecipeIngredientRepository extends JpaRepository<RecipeIngredient, Long> {

    List<RecipeIngredient> findByResultItemId(Long resultItemId);

    List<RecipeIngredient> findByIngredientItemId(Long ingredientItemId);

    Optional<RecipeIngredient> findByResultItemIdAndIngredientItemId(Long resultItemId, Long ingredientItemId);
}
