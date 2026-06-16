package com.crafttree.repository;

import com.crafttree.entity.Notification;
import com.crafttree.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    long countByRecipientAndReadFalse(User recipient);

    Optional<Notification> findByIdAndRecipient(Long id, User recipient);

    /** Foydalanuvchining barcha o'qilmaganlarini o'qilgan deb belgilaydi; ta'sirlangan qatorlar soni. */
    @Modifying
    @Query("UPDATE Notification n SET n.read = true WHERE n.recipient = :recipient AND n.read = false")
    int markAllRead(@Param("recipient") User recipient);
}
