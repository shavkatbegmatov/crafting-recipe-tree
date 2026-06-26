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
}
