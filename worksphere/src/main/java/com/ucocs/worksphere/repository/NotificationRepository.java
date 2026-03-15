package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    @Query("SELECT DISTINCT n FROM Notification n " +
           "LEFT JOIN FETCH n.recipient " +
           "WHERE n.recipient = :recipient " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByRecipientOrderByCreatedAtDesc(@Param("recipient") Employee recipient);

    @Query("SELECT DISTINCT n FROM Notification n " +
           "LEFT JOIN FETCH n.recipient " +
           "WHERE n.recipient = :recipient AND n.isRead = false " +
           "ORDER BY n.createdAt DESC")
    List<Notification> findByRecipientAndIsReadFalseOrderByCreatedAtDesc(@Param("recipient") Employee recipient);

    @Query("SELECT COUNT(n) FROM Notification n WHERE n.recipient = :recipient AND n.isRead = false")
    long countByRecipientAndIsReadFalse(@Param("recipient") Employee recipient);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.recipient = :recipient AND n.isRead = false")
    int markAllAsReadForRecipient(@Param("recipient") Employee recipient);
}
