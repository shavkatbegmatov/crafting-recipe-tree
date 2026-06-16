package com.crafttree.repository;

import com.crafttree.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Filtr + sahifalash. Har bir mezon ixtiyoriy (null/bo'sh → e'tiborga olinmaydi).
     * Saralash {@code createdAt DESC} — Pageable orqali beriladi.
     */
    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:actor IS NULL OR a.actorUsername = :actor)
              AND (:action IS NULL OR a.action = :action)
              AND (:targetType IS NULL OR a.targetType = :targetType)
            """)
    Page<AuditLog> search(@Param("actor") String actor,
                          @Param("action") String action,
                          @Param("targetType") String targetType,
                          Pageable pageable);
}
