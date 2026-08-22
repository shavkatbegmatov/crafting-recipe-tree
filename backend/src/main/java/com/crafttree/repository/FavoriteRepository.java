package com.crafttree.repository;

import com.crafttree.entity.Favorite;
import com.crafttree.entity.User;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FavoriteRepository extends JpaRepository<Favorite, Long> {

    /**
     * Foydalanuvchining sevimlilari, so'nggidan eskisiga.
     * <p>
     * Itemlar versiyaga bog'langani uchun tanlangan versiya bo'yicha filtrlanadi — aks holda
     * ro'yxatda turli versiyalardagi bir xil item takrorlanib ko'rinardi.
     */
    @EntityGraph(attributePaths = {"item", "item.category", "item.tags"})
    @Query("SELECT f FROM Favorite f WHERE f.user = :user AND f.item.gameVersion.id = :versionId "
            + "ORDER BY f.createdAt DESC")
    List<Favorite> findByUserAndVersion(@Param("user") User user, @Param("versionId") Long versionId);

    boolean existsByUserAndItemId(User user, Long itemId);

    void deleteByUserAndItemId(User user, Long itemId);

    /** Faqat item id'lari — frontend yulduzcha holatini belgilash uchun (yengil). */
    @Query("SELECT f.item.id FROM Favorite f WHERE f.user = :user AND f.item.gameVersion.id = :versionId")
    List<Long> findItemIdsByUserAndVersion(@Param("user") User user, @Param("versionId") Long versionId);
}
