package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hr.NotificationResponse;
import com.ucocs.worksphere.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get all notifications for the authenticated user.
     */
    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NotificationResponse>> getNotifications(Authentication auth) {
        return ResponseEntity.ok(notificationService.getNotificationsForUsername(auth.getName()));
    }

    /**
     * Get unread notification count.
     */
    @GetMapping("/unread-count")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication auth) {
        long count = notificationService.getUnreadCountForUsername(auth.getName());
        return ResponseEntity.ok(Map.of("count", count));
    }

    /**
     * Mark a single notification as read.
     */
    @PutMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable UUID id) {
        return ResponseEntity.ok(notificationService.markAsRead(id));
    }

    /**
     * Mark all notifications as read for the authenticated user.
     */
    @PutMapping("/read-all")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Integer>> markAllAsRead(Authentication auth) {
        int count = notificationService.markAllAsReadForUsername(auth.getName());
        return ResponseEntity.ok(Map.of("markedRead", count));
    }
}
