package com.crafttree.repository;

import com.crafttree.entity.ChatAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ChatAnnouncementRepository extends JpaRepository<ChatAnnouncement, Long> {

    /** Faol (eng so'nggi) e'lon. */
    Optional<ChatAnnouncement> findFirstByOrderByCreatedAtDesc();
}
