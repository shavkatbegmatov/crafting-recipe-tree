package com.crafttree.repository;

import com.crafttree.entity.ChatMessage;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * So'nggi xabarlar, foydalanuvchi bilan birga (EntityGraph orqali eager — N+1 yo'q).
     * <p>
     * Avval {@code @Query JOIN FETCH} ishlatilardi, lekin u Pageable bilan birga xabarlar
     * bir sahifani to'ldirganda count so'rovida xatoga olib kelardi (HTTP 500). EntityGraph'da
     * Spring count so'rovini fetch'siz, to'g'ri generatsiya qiladi.
     */
    // Reply va uning egasi ham oldindan yuklanadi — ChatMessageDto.from reply preview'ni o'qiydi,
    // open-in-view:false bilan bu LazyInitializationException (500) bermasligi uchun.
    @EntityGraph(attributePaths = {"user", "replyTo", "replyTo.user"})
    Page<ChatMessage> findAllByOrderByCreatedAtDesc(Pageable pageable);

    /** Admin moderatsiyasi: matn bo'yicha qidiruv + foydalanuvchi filtri. */
    @EntityGraph(attributePaths = "user")
    @Query("""
            SELECT m FROM ChatMessage m
            WHERE (:q = '' OR LOWER(m.content) LIKE CONCAT('%', :q, '%'))
              AND (:username IS NULL OR m.user.username = :username)
            ORDER BY m.createdAt DESC
            """)
    Page<ChatMessage> search(@Param("q") String q, @Param("username") String username, Pageable pageable);

    /** Berilgan vaqtdan keyingi xabarlar soni (masalan, bugungi faollik). */
    long countByCreatedAtAfter(LocalDateTime since);

    /** Eng faol yuboruvchilar: har bir element {@code [username, count]}. */
    @Query("SELECT m.user.username, COUNT(m) FROM ChatMessage m GROUP BY m.user.username ORDER BY COUNT(m) DESC")
    List<Object[]> topSenders(Pageable pageable);
}
