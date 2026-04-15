package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.AuditLog;
import com.ucocs.worksphere.enums.AuditAction;
import com.ucocs.worksphere.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Surfaces the AuditLog compliance trail that was previously persisted but
 * never exposed via an API endpoint.
 *
 * Access: HR, SUPER_ADMIN, AUDITOR — all read-only.
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuditLogController {

    private final AuditLogRepository auditLogRepository;

    /**
     * Returns audit log entries, optionally filtered by entityType, entityId, or action.
     * Results are always ordered newest-first (repository already enforces this per query;
     * for the unfiltered case we sort in memory since JpaRepository.findAll() has no default order).
     *
     * @param entityType  optional — e.g. "Employee", "OffboardingRecord", "GrievanceTicket"
     * @param entityId    optional — UUID of a specific record to inspect
     * @param action      optional — one of the {@link AuditAction} enum values
     * @param performedBy optional — UUID of the actor whose actions should be listed
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN', 'AUDITOR')")
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) UUID entityId,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) UUID performedBy) {

        List<AuditLog> results;

        if (entityType != null && entityId != null) {
            // Most specific: look up a single entity's full history
            results = auditLogRepository
                    .findByEntityTypeAndEntityIdOrderByCreatedAtDesc(entityType, entityId);

        } else if (performedBy != null) {
            // All actions by a specific actor
            results = auditLogRepository.findByPerformedByOrderByCreatedAtDesc(performedBy);

        } else if (action != null) {
            // All entries of a specific action type (e.g. all UPDATED entries)
            results = auditLogRepository.findByActionOrderByCreatedAtDesc(action);

        } else {
            // No filter — return everything, newest first
            results = auditLogRepository.findAll()
                    .stream()
                    .sorted(java.util.Comparator.comparing(
                            com.ucocs.worksphere.entity.BaseEntity::getCreatedAt,
                            java.util.Comparator.nullsLast(java.util.Comparator.reverseOrder())))
                    .toList();
        }

        return ResponseEntity.ok(results);
    }
}
