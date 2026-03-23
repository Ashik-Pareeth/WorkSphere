package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.TaskCreateRequest;
import com.ucocs.worksphere.dto.TaskStatusUpdate;
import com.ucocs.worksphere.dto.hr.TicketCommentResponse;
import com.ucocs.worksphere.entity.*;
import com.ucocs.worksphere.enums.EvidenceStatus;
import com.ucocs.worksphere.enums.GrievanceStatus;
import com.ucocs.worksphere.enums.TaskPriority;
import com.ucocs.worksphere.enums.TaskStatus;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final TaskEvidenceRepository taskEvidenceRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final TaskCommentRepository taskCommentRepository;
    private final GrievanceTicketRepository grievanceTicketRepository;
    private final TicketCommentRepository ticketCommentRepository;


    public TaskService(TaskRepository taskRepository, EmployeeRepository employeeRepository,
            TaskEvidenceRepository taskEvidenceRepository, TaskHistoryRepository taskHistoryRepository,
            TaskCommentRepository taskCommentRepository, GrievanceTicketRepository grievanceTicketRepository,
                       TicketCommentRepository ticketCommentRepository) {
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
        this.taskEvidenceRepository = taskEvidenceRepository;
        this.taskHistoryRepository = taskHistoryRepository;
        this.taskCommentRepository = taskCommentRepository;
        this.grievanceTicketRepository = grievanceTicketRepository;
        this.ticketCommentRepository = ticketCommentRepository;
    }

    public Task createTask(TaskCreateRequest request, UUID managerId) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        Employee assignee = employeeRepository.findById(request.assignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));

        // Generate Task Code First
        long count = taskRepository.count();
        String generatedCode = "TSK-" + (1000 + count + 1);

        // Convert string priority from DTO to Enum safely
        TaskPriority priorityEnum;
        try {
            priorityEnum = TaskPriority.valueOf(request.priority());
        } catch (Exception e) {
            priorityEnum = TaskPriority.MEDIUM;
        }

        // 1. Use the new strict Constructor
        Task newTask = new Task(
                generatedCode,
                request.title(),
                request.description(),
                manager,
                assignee,
                request.dueDate(),
                priorityEnum);

        newTask.setRequiresEvidence(request.requiresEvidence());

        Task savedTask = taskRepository.save(newTask);

        logHistory(savedTask, manager, "Created Task", "ROLE_MANAGER", null, TaskStatus.TODO);

        return savedTask;
    }

    public Task updateTaskStatus(UUID taskId, TaskStatusUpdate updateDTO) {
        Task task = taskRepository.findByIdWithRelations(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee currentUser = getCurrentUser();
        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = updateDTO.status();

        if (oldStatus == newStatus)
            return task;

        boolean isAdmin = hasRole(currentUser, "ADMIN");
        boolean isAssigner = task.getAssigner().getId().equals(currentUser.getId());
        boolean isAssignee = task.getAssignedTo().getId().equals(currentUser.getId());
        boolean isDirectManager = task.getAssignedTo().getManager() != null
                && task.getAssignedTo().getManager().getId().equals(currentUser.getId());
        boolean hasOversight = isAdmin || isAssigner || isDirectManager;

        // --- ROLE PROTECTIONS ---
        if ((newStatus == TaskStatus.COMPLETED || newStatus == TaskStatus.CANCELLED) && !hasOversight) {
            throw new AccessDeniedException(
                    "Only the Assigner, Direct Manager, or Admin can complete or cancel tasks.");
        }

        // --- WIP LIMIT ENFORCEMENT ---
        if (newStatus == TaskStatus.IN_PROGRESS && !hasOversight) { // Managers can bypass WIP limits if needed
            long currentWip = taskRepository.countByAssignedTo_IdAndStatus(task.getAssignedTo().getId(),
                    TaskStatus.IN_PROGRESS);
            if (currentWip >= 3) {
                throw new IllegalStateException(
                        "WIP Limit Reached: You already have 3 tasks in progress. Finish one first.");
            }
        }

        // --- EVIDENCE GATEKEEPERS ---
        if (!hasOversight && newStatus == TaskStatus.IN_REVIEW) {
            if (task.isRequiresEvidence()) {
                boolean hasEvidence = taskEvidenceRepository.existsByTask_Id(taskId);
                if (!hasEvidence) {
                    throw new IllegalStateException("Evidence is mandatory before submitting this task for review.");
                }
            }
        }

        if (newStatus == TaskStatus.COMPLETED && task.isRequiresEvidence()) {
            boolean hasAcceptedEvidence = taskEvidenceRepository.findAllByTaskId(taskId).stream()
                    .anyMatch(e -> e.getStatus() == EvidenceStatus.ACCEPTED);

            if (!hasAcceptedEvidence) {
                throw new IllegalStateException("Cannot complete task: No accepted evidence found.");
            }
        }

        // --- EXECUTE BUSINESS METHODS ---
        switch (newStatus) {
            case IN_PROGRESS -> task.startProgress();
            case IN_REVIEW -> task.submitForReview();
            case COMPLETED -> task.markAsCompleted();
            case CANCELLED -> task.cancelTask();
            case TODO -> {
                if (hasOversight)
                    task.kickBackToInProgress(); // Adjust based on your business logic
            }
        }

        if (isAdmin) {
            task.overrideSystem();
        }

        Task savedTask = taskRepository.save(task);

        // HELPDESK AUTO-SYNC LOGIC
        if (savedTask.getSourceTicket() != null) {
            GrievanceTicket ticket = savedTask.getSourceTicket();
            boolean statusChanged = false;

            if (newStatus == TaskStatus.COMPLETED) {
                ticket.setStatus(GrievanceStatus.RESOLVED);
                ticket.setResolution("Automatically resolved via linked Helpdesk Task completion.");
                ticket.setResolvedAt(LocalDateTime.now());
                statusChanged = true;
            } else if (newStatus == TaskStatus.IN_REVIEW) {
                ticket.setStatus(GrievanceStatus.PENDING_INFO);
                statusChanged = true;
            } else if (newStatus == TaskStatus.IN_PROGRESS) {
                ticket.setStatus(GrievanceStatus.IN_PROGRESS);
                statusChanged = true;
            }

            if (statusChanged) {
                grievanceTicketRepository.save(ticket);
                log.info("Auto-synced Ticket {} status to {}", ticket.getTicketNumber(), ticket.getStatus());
            }
        }
        String roleSnapshot = isAdmin ? "ROLE_ADMIN" : "ROLE_EMPLOYEE";
        logHistory(savedTask, currentUser, updateDTO.comment(), roleSnapshot, oldStatus, newStatus);

        return taskRepository.findByIdWithRelations(taskId)
                .orElseThrow(() -> new IllegalStateException("Task vanished after saving!"));
    }

    public Task rateTask(UUID taskId, Integer rating) {
        Task task = taskRepository.findByIdWithRelations(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee currentUser = getCurrentUser();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assert auth != null;

        boolean isAdmin = hasRole(currentUser, "ADMIN");
        boolean isAssigner = task.getAssigner().getId().equals(currentUser.getId());
        boolean isDirectManager = task.getAssignedTo().getManager() != null
                && task.getAssignedTo().getManager().getId().equals(currentUser.getId());

        if (!isAdmin && !isAssigner && !isDirectManager) {
            throw new AccessDeniedException("Only the Assigner, Direct Manager, or Admin can rate tasks.");
        }

        // Calculate score based on lateness
        double score = task.isOverdue() ? 0.0 : 50.0;
        if (rating != null) {
            score += (rating * 10.0);
        }

        // Use the new entity method
        task.rateTask(rating, score);

        return taskRepository.save(task);
    }

    public Task flagTask(UUID taskId, String reason) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee currentUser = getCurrentUser();
        if (!hasRole(currentUser, "ROLE_AUDITOR") && !hasRole(currentUser, "ROLE_ADMIN")) {
            throw new AccessDeniedException("Only Auditors can flag tasks.");
        }

        // Use the new entity method
        task.flagForAudit(reason, currentUser);

        logHistory(task, currentUser, "Flagged: " + reason, "ROLE_AUDITOR", task.getStatus(), task.getStatus());

        return taskRepository.save(task);
    }

    // --- READ OPERATIONS ---

    public List<Task> getMyTasks(UUID employeeId) {
        return taskRepository.findByAssignedTo_Id(employeeId);
    }

    public List<Task> getTeamTasks(UUID employeeId) {
        // Ask Spring Security for your roles directly from the authenticated token
        boolean isGlobalViewer = Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication())
                .getAuthorities().stream()
                .anyMatch(a -> {
                    String role = a.getAuthority();
                    assert role != null;
                    String normalizedRole = role.startsWith("ROLE_") ? role.substring(5) : role;
                    return normalizedRole.equals("ADMIN") || normalizedRole.equals("HR") || normalizedRole.equals("AUDITOR");
                });

        if (isGlobalViewer) {
            return taskRepository.findAllWithRelations();
        }

        // If not a global viewer, they must be a Manager. Give them their assigned
        // tasks + tasks given to direct reports
        List<Task> assignedByMe = taskRepository.findByAssigner_Id(employeeId);
        List<Task> assignedToMyTeam = taskRepository.findByAssignedTo_Manager_Id(employeeId);

        Set<Task> combined = new HashSet<>(assignedByMe);
        combined.addAll(assignedToMyTeam);

        return new ArrayList<>(combined);
    }

    public List<Task> getTasksByManager(UUID managerId) {
        return taskRepository.findByAssigner_Id(managerId);
    }

    public List<TaskComment> getTaskComments(UUID taskId) {
        return taskCommentRepository.findByTask_IdOrderByCreatedAtAsc(taskId);
    }

    public TaskComment addComment(UUID taskId, UUID employeeId, String content) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        Employee employee = employeeRepository.findById(employeeId).orElseThrow();

        TaskComment comment = new TaskComment();
        comment.setTask(task);
        comment.setAuthor(employee);
        comment.setContent(content);
        comment.setCreatedAt(LocalDateTime.now());

        return taskCommentRepository.save(comment);
    }

    // --- HELPERS ---

    private void logHistory(Task task, Employee actor, String comment, String roleSnapshot,
            TaskStatus oldStatus, TaskStatus newStatus) {
        TaskHistory history = new TaskHistory(
                task,
                actor,
                roleSnapshot,
                oldStatus != null ? oldStatus : task.getStatus(),
                newStatus != null ? newStatus : task.getStatus(),
                comment);
        taskHistoryRepository.save(history);
    }

    private Employee getCurrentUser() {
        String username = Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getName();
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean hasRole(Employee employee, String roleName) {
        String normalizedTarget = roleName.startsWith("ROLE_") ? roleName.substring(5) : roleName;
        return employee.getRoles().stream()
                .anyMatch(r -> {
                    String dbRole = r.getRoleName();
                    String normalizedDb = dbRole != null && dbRole.startsWith("ROLE_") ? dbRole.substring(5) : dbRole;
                    return normalizedTarget.equals(normalizedDb);
                });
    }

    public Task getTaskById(UUID taskId) {
        return  taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

    // TaskService.java
    @Transactional(readOnly = true)
    public List<TicketCommentResponse> getSourceTicketComments(UUID taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        if (task.getSourceTicket() == null) return List.of();

        return ticketCommentRepository
                .findByTicketAndIsInternalFalseOrderByCreatedAtAsc(task.getSourceTicket())
                .stream()
                .map(c -> TicketCommentResponse.builder()
                        .id(c.getId())
                        .content(c.getContent())
                        .authorName(c.getAuthor().getFirstName() + " " + c.getAuthor().getLastName())
                        .authorId(c.getAuthor().getId())
                        .createdAt(c.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}