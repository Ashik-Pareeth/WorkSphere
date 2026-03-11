package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hr.*;
import com.ucocs.worksphere.enums.GrievanceStatus;
import com.ucocs.worksphere.service.GrievanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr/tickets")
@RequiredArgsConstructor
public class GrievanceController {

    private final GrievanceService grievanceService;

    /**
     * Get all tickets (HR/Admin view with internal comments visible).
     */
    @GetMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<TicketResponse>> getAllTickets(
            @RequestParam(required = false) GrievanceStatus status) {
        List<TicketResponse> tickets = status != null ? grievanceService.getTicketsByStatus(status)
                : grievanceService.getAllTickets();
        return ResponseEntity.ok(tickets);
    }

    /**
     * Submit a new grievance ticket. Any authenticated employee.
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketResponse> createTicket(
            @Valid @RequestBody TicketCreateRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(grievanceService.createTicket(request, auth.getName()));
    }

    /**
     * Assign a ticket to a handler (HR action).
     */
    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<TicketResponse> assignTicket(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        UUID assignToId = UUID.fromString(body.get("assignToId"));
        return ResponseEntity.ok(grievanceService.assignTicket(id, assignToId, auth.getName()));
    }

    /**
     * Add a comment to a ticket thread.
     */
    @PostMapping("/{id}/comment")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TicketCommentResponse> addComment(
            @PathVariable UUID id,
            @Valid @RequestBody TicketCommentRequest request,
            Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(grievanceService.addComment(id, request, auth.getName()));
    }

    /**
     * Resolve a ticket (HR action).
     */
    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<TicketResponse> resolveTicket(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body,
            Authentication auth) {
        String resolution = body.get("resolution");
        return ResponseEntity.ok(grievanceService.resolveTicket(id, resolution, auth.getName()));
    }

    /**
     * Get the authenticated employee's own tickets (non-internal comments only).
     */
    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TicketResponse>> getMyTickets(Authentication auth) {
        return ResponseEntity.ok(grievanceService.getMyTickets(auth.getName()));
    }
}

