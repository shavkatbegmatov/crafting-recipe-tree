package com.crafttree.repository;

import com.crafttree.entity.ChatMessageReaction;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ChatMessageReactionRepository extends JpaRepository<ChatMessageReaction, Long> {

    Optional<ChatMessageReaction> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);

    /** Xabar reaksiyalari (foydalanuvchi bilan — guruhlash uchun username kerak). */
    @EntityGraph(attributePaths = "user")
    List<ChatMessageReaction> findByMessageId(Long messageId);
}
