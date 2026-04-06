package com.crafttree.repository;

import com.crafttree.entity.CraftItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CraftItemRepository extends JpaRepository<CraftItem, Long> {

    @Query("SELECT ci FROM CraftItem ci WHERE ci.category.code = :code ORDER BY ci.name")
    List<CraftItem> findByCategoryCode(@Param("code") String code);

    @Query("SELECT ci FROM CraftItem ci WHERE " +
           "LOWER(ci.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(ci.nameUz) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(ci.nameEn) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(ci.nameUzCyr) LIKE LOWER(CONCAT('%', :query, '%')) " +
           "ORDER BY ci.name")
    List<CraftItem> searchByName(@Param("query") String query);

    List<CraftItem> findAllByOrderByCategoryIdAscNameAsc();
}
