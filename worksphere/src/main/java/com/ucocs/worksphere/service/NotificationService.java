package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hr.NotificationResponse;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Notification;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;

    /**
     * Create and persist an in-app notification for a specific employee (by UUID).
     * Used internally by other services.
     */
    @Transactional
    public Notification send(UUID recipientId, NotificationType type, String title,
            String message, UUID referenceId, String referenceType) {
        Employee recipient = employeeRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Notification recipient not found: " + recipientId));

        Notification notification = new Notification();
        notification.setRecipient(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setIsRead(false);

        Notification saved = notificationRepository.save(notification);
        log.info("Notification sent to {}: [{}] {}", recipientId, type, title);

        return saved;
    }

    /**
     * Fetch all notifications for the authenticated user by username.
     */
    public List<NotificationResponse> getNotificationsForUsername(String username) {
        Employee user = resolveEmployee(username);
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(user)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notification count for a user by username.
     */
    public long getUnreadCountForUsername(String username) {
        Employee user = resolveEmployee(username);
        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    /**
     * Mark a single notification as read.
     */
    @Transactional
    public NotificationResponse markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found: " + notificationId));

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }

        return toResponse(notification);
    }

    /**
     * Mark all notifications as read for a user by username.
     */
    @Transactional
    public int markAllAsReadForUsername(String username) {
        Employee user = resolveEmployee(username);
        return notificationRepository.markAllAsReadForRecipient(user);
    }

    private Employee resolveEmployee(String username) {
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + username));
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .type(n.getType())
                .title(n.getTitle())
                .message(n.getMessage())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .isRead(n.getIsRead())
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
