package com.crafttree.repository;

import com.crafttree.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByReferralCode(String referralCode);

    boolean existsByUsername(String username);

    long countByReferredBy(User referrer);

    // ── Admin paneli uchun ──

    long countByRole(String role);

    /** Berilgan roldagi barcha foydalanuvchilar — masalan, super-adminlarga bildirishnoma yuborish uchun. */
    List<User> findByRole(String role);

    long countByEnabledFalse();

    /**
     * Qidiruv + filtr + sahifalash. Har bir mezon ixtiyoriy:
     * null bo'lsa o'sha filtr e'tiborga olinmaydi (hammasi qaytadi).
     */
    @Query("""
            SELECT u FROM User u
            WHERE (:q = ''
                   OR LOWER(u.username) LIKE CONCAT('%', :q, '%')
                   OR LOWER(COALESCE(u.displayName, '')) LIKE CONCAT('%', :q, '%'))
              AND (:role IS NULL OR u.role = :role)
              AND (:enabled IS NULL OR u.enabled = :enabled)
            """)
    Page<User> search(@Param("q") String q,
                       @Param("role") String role,
                       @Param("enabled") Boolean enabled,
                       Pageable pageable);

    /**
     * Berilgan foydalanuvchini taklif qilgan deb belgilangan boshqa foydalanuvchilarning
     * referral bog'lanishini uzadi. O'chirishdan oldin FK cheklovini buzmaslik uchun kerak.
     */
    @Modifying
    @Query("UPDATE User u SET u.referredBy = NULL WHERE u.referredBy.id = :userId")
    void clearReferrerReferences(@Param("userId") Long userId);
}
