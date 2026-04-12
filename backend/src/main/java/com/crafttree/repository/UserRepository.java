package com.crafttree.repository;

import com.crafttree.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByReferralCode(String referralCode);

    boolean existsByUsername(String username);

    long countByReferredBy(User referrer);
}
