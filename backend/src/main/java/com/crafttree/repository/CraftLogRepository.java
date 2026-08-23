package com.crafttree.repository;

import com.crafttree.entity.CraftLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CraftLogRepository extends JpaRepository<CraftLog, Long> {

    /** Foydalanuvchining kraft tarixi — eng yangisi avval (resultItem eager). */
    @EntityGraph(attributePaths = {"resultItem", "resultItem.category"})
    Page<CraftLog> findByUserIdOrderByCraftedAtDesc(Long userId, Pageable pageable);

    /**
     * Item o'chirilganda nechta kraft tarixi yozuvi ham yo'qolishini oldindan ko'rsatish uchun.
     * FK ON DELETE CASCADE — tarix jimgina o'chib ketmasligi kerak, admin buni ko'rib tursin.
     */
    long countByResultItemId(Long itemId);
}
