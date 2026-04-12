package com.crafttree.repository;

import com.crafttree.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    @Query("SELECT m FROM ChatMessage m JOIN FETCH m.user ORDER BY m.createdAt DESC")
    Page<ChatMessage> findAllWithUser(Pageable pageable);
}
