package com.crafttree.repository;

import com.crafttree.entity.Favorite;
import com.crafttree.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    /** Foydalanuvchining sevimlilari, so'nggidan eskisiga. Item + kategoriya + teglar oldindan yuklanadi. */
    @EntityGraph(attributePaths = {"item", "item.category", "item.tags"})
    List<Favorite> findByUserOrderByCreatedAtDesc(User user);

    boolean existsByUserAndItemId(User user, Long itemId);

    void deleteByUserAndItemId(User user, Long itemId);

    /** Faqat item id'lari — frontend yulduzcha holatini belgilash uchun (yengil). */
    @Query("SELECT f.item.id FROM Favorite f WHERE f.user = :user")
    List<Long> findItemIdsByUser(@Param("user") User user);
}
