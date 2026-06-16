package com.crafttree.repository;

import com.crafttree.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * So'nggi xabarlar, foydalanuvchi bilan birga (EntityGraph orqali eager — N+1 yo'q).
     * <p>
     * Avval {@code @Query JOIN FETCH} ishlatilardi, lekin u Pageable bilan birga xabarlar
     * bir sahifani to'ldirganda count so'rovida xatoga olib kelardi (HTTP 500). EntityGraph'da
     * Spring count so'rovini fetch'siz, to'g'ri generatsiya qiladi.
     */
    @EntityGraph(attributePaths = "user")
    Page<ChatMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
