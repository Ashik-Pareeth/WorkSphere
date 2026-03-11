package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hr.*;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.GrievanceTicket;
import com.ucocs.worksphere.entity.TicketComment;
import com.ucocs.worksphere.enums.*;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.GrievanceTicketRepository;
import com.ucocs.worksphere.repository.TicketCommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Year;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GrievanceService {

        private final GrievanceTicketRepository ticketRepository;
        private final TicketCommentRepository commentRepository;
        private final EmployeeRepository employeeRepository;
        private final AuditService auditService;
        private final NotificationService notificationService;

        /**
         * Submit a new grievance ticket.
         */
        @Transactional
        public TicketResponse createTicket(TicketCreateRequest request, String raisedByUsername) {
                Employee raisedBy = resolveEmployee(raisedByUsername);

                GrievanceTicket ticket = new GrievanceTicket();
                ticket.setTicketNumber(generateTicketNumber());
                ticket.setCategory(request.getCategory());
                ticket.setPriority(request.getPriority());
                ticket.setSubject(request.getSubject());
                ticket.setDescription(request.getDescription());
                ticket.setStatus(GrievanceStatus.OPEN);
                ticket.setRaisedBy(raisedBy);

                GrievanceTicket saved = ticketRepository.save(ticket);

                auditService.log("GrievanceTicket", saved.getId(), AuditAction.CREATED,
                                raisedBy.getId(), null, saved.getTicketNumber());

                log.info("Ticket {} created by {}", saved.getTicketNumber(), raisedByUsername);
                return toResponse(saved, false);
        }

        /**
         * Get all tickets (HR view).
         */
        @Transactional(readOnly = true)
        public List<TicketResponse> getAllTickets() {
                return ticketRepository.findAll().stream()
                                .map(t -> toResponse(t, true))
                                .collect(Collectors.toList());
        }

        /**
         * Get tickets by status.
         */
        @Transactional(readOnly = true)
        public List<TicketResponse> getTicketsByStatus(GrievanceStatus status) {
                return ticketRepository.findByStatus(status).stream()
                                .map(t -> toResponse(t, true))
                                .collect(Collectors.toList());
        }

        /**
         * Get tickets raised by the authenticated employee.
         */
        @Transactional(readOnly = true)
        public List<TicketResponse> getMyTickets(String username) {
                Employee employee = resolveEmployee(username);
                return ticketRepository.findByRaisedByOrderByCreatedAtDesc(employee).stream()
                                .map(t -> toResponse(t, false))
                                .collect(Collectors.toList());
        }

        /**
         * Assign a ticket to a handler (HR action).
         */
        @Transactional
        public TicketResponse assignTicket(UUID ticketId, UUID assignToId, String performedByUsername) {
                Employee performer = resolveEmployee(performedByUsername);

                GrievanceTicket ticket = ticketRepository.findById(ticketId)
                                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

                employeeRepository.findById(assignToId)
                                .orElseThrow(() -> new RuntimeException("Handler not found: " + assignToId));

                ticket.setAssignedTo(assignToId);
                ticket.setStatus(GrievanceStatus.IN_PROGRESS);

                GrievanceTicket saved = ticketRepository.save(ticket);

                auditService.log("GrievanceTicket", saved.getId(), AuditAction.ASSIGNED,
                                performer.getId(), null, "Assigned to: " + assignToId);

                notificationService.send(
                                ticket.getRaisedBy().getId(),
                                NotificationType.TICKET_UPDATE,
                                "Ticket " + ticket.getTicketNumber() + " is now being handled",
                                "Your ticket has been assigned and is being worked on.",
                                ticket.getId(),
                                "GrievanceTicket");

                log.info("Ticket {} assigned to {}", saved.getTicketNumber(), assignToId);
                return toResponse(saved, true);
        }

        /**
         * Add a comment to a ticket thread.
         */
        @Transactional
        public TicketCommentResponse addComment(UUID ticketId, TicketCommentRequest request, String authorUsername) {
                Employee author = resolveEmployee(authorUsername);

                GrievanceTicket ticket = ticketRepository.findById(ticketId)
                                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

                boolean isOwner = ticket.getRaisedBy().getId().equals(author.getId());
                boolean hasAdminOrHr = author.getRoles().stream()
                                .anyMatch(r -> r.getRoleName().equals("ADMIN") || r.getRoleName().equals("HR"));

                if (!isOwner && !hasAdminOrHr) {
                        throw new AccessDeniedException("You do not have permission to comment on this ticket.");
                }

                TicketComment comment = new TicketComment();
                comment.setTicket(ticket);
                comment.setContent(request.getContent());
                comment.setIsInternal(request.getIsInternal() != null ? request.getIsInternal() : false);
                comment.setAuthor(author);

                TicketComment saved = commentRepository.save(comment);

                if (!saved.getIsInternal() && !ticket.getRaisedBy().getId().equals(author.getId())) {
                        notificationService.send(
                                        ticket.getRaisedBy().getId(),
                                        NotificationType.TICKET_UPDATE,
                                        "New comment on ticket " + ticket.getTicketNumber(),
                                        "A new response has been added to your ticket: " + ticket.getSubject(),
                                        ticket.getId(),
                                        "GrievanceTicket");
                }

                return toCommentResponse(saved);
        }

        /**
         * Resolve a ticket (HR action).
         */
        @Transactional
        public TicketResponse resolveTicket(UUID ticketId, String resolution, String performedByUsername) {
                Employee performer = resolveEmployee(performedByUsername);

                GrievanceTicket ticket = ticketRepository.findById(ticketId)
                                .orElseThrow(() -> new RuntimeException("Ticket not found: " + ticketId));

                ticket.setStatus(GrievanceStatus.RESOLVED);
                ticket.setResolution(resolution);
                ticket.setResolvedAt(LocalDateTime.now());

                GrievanceTicket saved = ticketRepository.save(ticket);

                auditService.log("GrievanceTicket", saved.getId(), AuditAction.UPDATED,
                                performer.getId(), "Status: " + GrievanceStatus.IN_PROGRESS, "Status: RESOLVED");

                notificationService.send(
                                ticket.getRaisedBy().getId(),
                                NotificationType.TICKET_UPDATE,
                                "Ticket " + ticket.getTicketNumber() + " resolved",
                                "Your ticket has been resolved: " + resolution,
                                ticket.getId(),
                                "GrievanceTicket");

                log.info("Ticket {} resolved by {}", saved.getTicketNumber(), performedByUsername);
                return toResponse(saved, true);
        }

        private Employee resolveEmployee(String username) {
                return employeeRepository.findByUserName(username)
                                .orElseThrow(() -> new RuntimeException("Employee not found: " + username));
        }

        private String generateTicketNumber() {
                int currentYear = Year.now().getValue();
                String yearPrefix = "GR-" + currentYear + "-%";
                int maxSeq = ticketRepository.findMaxSequenceForYear(yearPrefix);
                return String.format("GR-%d-%04d", currentYear, maxSeq + 1);
        }

        private TicketResponse toResponse(GrievanceTicket ticket, boolean includeInternalComments) {
                List<TicketCommentResponse> comments;
                if (includeInternalComments) {
                        comments = commentRepository.findByTicketOrderByCreatedAtAsc(ticket).stream()
                                        .map(this::toCommentResponse)
                                        .collect(Collectors.toList());
                } else {
                        comments = commentRepository.findByTicketAndIsInternalFalseOrderByCreatedAtAsc(ticket).stream()
                                        .map(this::toCommentResponse)
                                        .collect(Collectors.toList());
                }

                String assignedToName = null;
                if (ticket.getAssignedTo() != null) {
                        assignedToName = employeeRepository.findById(ticket.getAssignedTo())
                                        .map(e -> e.getFirstName() + " " + e.getLastName())
                                        .orElse("Unknown");
                }

                return TicketResponse.builder()
                                .id(ticket.getId())
                                .ticketNumber(ticket.getTicketNumber())
                                .category(ticket.getCategory())
                                .priority(ticket.getPriority())
                                .subject(ticket.getSubject())
                                .description(ticket.getDescription())
                                .status(ticket.getStatus())
                                .resolution(ticket.getResolution())
                                .raisedByName(ticket.getRaisedBy().getFirstName() + " "
                                                + ticket.getRaisedBy().getLastName())
                                .raisedById(ticket.getRaisedBy().getId())
                                .assignedToName(assignedToName)
                                .assignedToId(ticket.getAssignedTo())
                                .comments(comments)
                                .createdAt(ticket.getCreatedAt())
                                .resolvedAt(ticket.getResolvedAt())
                                .build();
        }

        private TicketCommentResponse toCommentResponse(TicketComment comment) {
                return TicketCommentResponse.builder()
                                .id(comment.getId())
                                .content(comment.getContent())
                                .isInternal(comment.getIsInternal())
                                .authorName(comment.getAuthor().getFirstName() + " "
                                                + comment.getAuthor().getLastName())
                                .authorId(comment.getAuthor().getId())
                                .createdAt(comment.getCreatedAt())
                                .build();
        }
}
