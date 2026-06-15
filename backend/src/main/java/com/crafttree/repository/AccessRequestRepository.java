package com.crafttree.repository;

import com.crafttree.entity.AccessRequest;
import com.crafttree.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AccessRequestRepository extends JpaRepository<AccessRequest, Long> {

    /** Foydalanuvchida shu holatdagi ariza bormi (ayniqsa PENDING tekshiruvi uchun). */
    boolean existsByUserAndStatus(User user, String status);

    /** Foydalanuvchining eng so'nggi arizasi — profilda joriy holatni ko'rsatish uchun. */
    Optional<AccessRequest> findFirstByUserOrderByCreatedAtDesc(User user);

    /** Badge uchun: shu holatdagi arizalar soni (masalan, kutilayotganlar). */
    long countByStatus(String status);

    /**
     * Holat bo'yicha sahifalangan ro'yxat. {@code user} va {@code reviewedBy} bog'lanishlari
     * EntityGraph bilan oldindan yuklanadi — N+1 so'rovlarning oldini olish uchun.
     */
    @EntityGraph(attributePaths = {"user", "reviewedBy"})
    Page<AccessRequest> findByStatus(String status, Pageable pageable);

    /** Holat filtri berilmaganda — barcha arizalar (bog'lanishlar oldindan yuklangan). */
    @Override
    @EntityGraph(attributePaths = {"user", "reviewedBy"})
    Page<AccessRequest> findAll(Pageable pageable);
}
