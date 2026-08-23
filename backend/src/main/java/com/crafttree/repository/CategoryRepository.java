package com.crafttree.repository;

import com.crafttree.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

/**
 * Kategoriyalar <b>versiyaga bog'langan</b>: deyarli har bir so'rov {@code versionId}
 * talab qiladi. Versiyasiz variantlar ataylab qoldirilmagan — global ro'yxat boshqa
 * versiyaning kategoriyalarini aralashtirib yuborardi.
 */
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByCodeAndGameVersionId(String code, Long versionId);

    boolean existsByCodeAndGameVersionId(String code, Long versionId);

    List<Category> findByGameVersionIdOrderBySortOrderAsc(Long versionId);

    long countByGameVersionId(Long versionId);
}
