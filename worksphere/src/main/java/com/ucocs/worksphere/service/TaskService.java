package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.TaskCreateRequest;
import com.ucocs.worksphere.dto.TaskStatusUpdate;
import com.ucocs.worksphere.dto.hr.TicketCommentResponse;
import com.ucocs.worksphere.entity.*;
import com.ucocs.worksphere.enums.*;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
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
    private final NotificationService notificationService; // ADDED
    private final AuditService auditService;

    public TaskService(TaskRepository taskRepository, EmployeeRepository employeeRepository,
                       TaskEvidenceRepository taskEvidenceRepository, TaskHistoryRepository taskHistoryRepository,
                       TaskCommentRepository taskCommentRepository, GrievanceTicketRepository grievanceTicketRepository,
                       TicketCommentRepository ticketCommentRepository,
                       NotificationService notificationService,
                       AuditService auditService) {           // ADDED
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
        this.taskEvidenceRepository = taskEvidenceRepository;
        this.taskHistoryRepository = taskHistoryRepository;
        this.taskCommentRepository = taskCommentRepository;
        this.grievanceTicketRepository = grievanceTicketRepository;
        this.ticketCommentRepository = ticketCommentRepository;
        this.notificationService = notificationService;         // ADDED
        this.auditService = auditService;
    }

    public Task createTask(TaskCreateRequest request, UUID managerId) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        Employee assignee = employeeRepository.findById(request.assignedToId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));

        long count = taskRepository.count();
        String generatedCode = "TSK-" + (1000 + count + 1);

        TaskPriority priorityEnum;
        try {
            priorityEnum = TaskPriority.valueOf(request.priority());
        } catch (Exception e) {
            priorityEnum = TaskPriority.MEDIUM;
        }

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

        // NOTIFICATION: Notify the assignee that a task was assigned to them
        notificationService.send(
                assignee.getId(),
                NotificationType.TASK_ASSIGNED,
                "New Task Assigned: " + savedTask.getTitle(),
                manager.getFirstName() + " " + manager.getLastName() + " has assigned you a new task: \"" + savedTask.getTitle() + "\" (" + generatedCode + "). Due: " + request.dueDate() + ".",
                savedTask.getId(),
                "Task"
        );

        auditService.log("Task", savedTask.getId(), AuditAction.CREATED, manager.getId(), null, savedTask.getTitle());

        return savedTask;
    }

    public Task updateTask(UUID taskId, TaskCreateRequest request, UUID callerId) {
        Task task = taskRepository.findByIdWithRelations(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee caller = employeeRepository.findById(callerId)
                .orElseThrow(() -> new ResourceNotFoundException("Caller not found"));

        boolean isAssigner = task.getAssigner().getId().equals(callerId);
        boolean isAdmin = hasRole(caller, "ADMIN");
        if (!isAssigner && !isAdmin) {
            throw new AccessDeniedException("Only the task creator or an admin can edit this task.");
        }

        String oldTitle = task.getTitle();
        task.setTitle(request.title());
        task.setDescription(request.description());

        if (request.assignedToId() != null && !request.assignedToId().equals(task.getAssignedTo().getId())) {
            Employee newAssignee = employeeRepository.findById(request.assignedToId())
                    .orElseThrow(() -> new ResourceNotFoundException("New assignee not found"));
            task.setAssignedTo(newAssignee);
        }

        Task saved = taskRepository.save(task);
        auditService.log("Task", saved.getId(), AuditAction.UPDATED, callerId, oldTitle, saved.getTitle());
        return saved;
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

        if ((newStatus == TaskStatus.COMPLETED || newStatus == TaskStatus.CANCELLED) && !hasOversight) {
            throw new AccessDeniedException(
                    "Only the Assigner, Direct Manager, or Admin can complete or cancel tasks.");
        }

        if (newStatus == TaskStatus.IN_PROGRESS && !hasOversight) {
            long currentWip = taskRepository.countByAssignedTo_IdAndStatus(task.getAssignedTo().getId(),
                    TaskStatus.IN_PROGRESS);
            if (currentWip >= 3) {
                throw new IllegalStateException(
                        "WIP Limit Reached: You already have 3 tasks in progress. Finish one first.");
            }
        }

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

        switch (newStatus) {
            case IN_PROGRESS -> task.startProgress();
            case IN_REVIEW -> task.submitForReview();
            case COMPLETED -> task.markAsCompleted();
            case CANCELLED -> task.cancelTask();
            case TODO -> {
                if (hasOversight)
                    task.kickBackToInProgress();
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

        // NOTIFICATION: Notify relevant parties of the status change
        String friendlyStatus = newStatus.name().replace("_", " ");

        // If a manager/admin changed the status, notify the assignee
        if (hasOversight && !currentUser.getId().equals(task.getAssignedTo().getId())) {
            notificationService.send(
                    task.getAssignedTo().getId(),
                    NotificationType.TASK_STATUS_UPDATED,
                    "Task \"" + task.getTitle() + "\" marked as " + friendlyStatus,
                    currentUser.getFirstName() + " " + currentUser.getLastName() + " updated your task \"" + task.getTitle() + "\" to " + friendlyStatus + (updateDTO.comment() != null && !updateDTO.comment().isBlank() ? ". Comment: " + updateDTO.comment() : "."),
                    savedTask.getId(),
                    "Task"
            );
        }

        // If the assignee moved the task to IN_REVIEW, notify the assigner
        if (newStatus == TaskStatus.IN_REVIEW && isAssignee) {
            notificationService.send(
                    task.getAssigner().getId(),
                    NotificationType.TASK_STATUS_UPDATED,
                    "Task ready for review: \"" + task.getTitle() + "\"",
                    task.getAssignedTo().getFirstName() + " " + task.getAssignedTo().getLastName() + " has submitted task \"" + task.getTitle() + "\" (" + task.getTaskCode() + ") for your review.",
                    savedTask.getId(),
                    "Task"
            );
        }

        // If task is completed, also send a TASK_COMPLETED notification to the assignee
        if (newStatus == TaskStatus.COMPLETED) {
            notificationService.send(
                    task.getAssignedTo().getId(),
                    NotificationType.TASK_COMPLETED,
                    "Task Completed: \"" + task.getTitle() + "\"",
                    "Task \"" + task.getTitle() + "\" (" + task.getTaskCode() + ") has been marked as completed.",
                    savedTask.getId(),
                    "Task"
            );
        }

        auditService.log("Task", savedTask.getId(), AuditAction.UPDATED, currentUser.getId(), oldStatus.name(), newStatus.name());

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

        double score = task.isOverdue() ? 0.0 : 50.0;
        if (rating != null) {
            score += (rating * 10.0);
        }

        task.rateTask(rating, score);
        Task savedTask = taskRepository.save(task);

        // NOTIFICATION: Notify the assignee that their task was rated
        notificationService.send(
                task.getAssignedTo().getId(),
                NotificationType.TASK_RATED,
                "Your task has been rated",
                currentUser.getFirstName() + " " + currentUser.getLastName() + " rated your task \"" + task.getTitle() + "\" " + rating + "/5 (score: " + (int) score + ").",
                savedTask.getId(),
                "Task"
        );

        return savedTask;
    }

    public Task flagTask(UUID taskId, String reason) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee currentUser = getCurrentUser();
        if (!hasRole(currentUser, "ROLE_AUDITOR") && !hasRole(currentUser, "ROLE_ADMIN")) {
            throw new AccessDeniedException("Only Auditors can flag tasks.");
        }

        task.flagForAudit(reason, currentUser);
        logHistory(task, currentUser, "Flagged: " + reason, "ROLE_AUDITOR", task.getStatus(), task.getStatus());

        return taskRepository.save(task);
    }

    // --- READ OPERATIONS ---

    public List<Task> getMyTasks(UUID employeeId) {
        return taskRepository.findByAssignedTo_Id(employeeId);
    }

    public List<Task> getStrictTeamTasks(UUID employeeId) {
        List<Task> assignedByMe = taskRepository.findByAssigner_Id(employeeId);
        List<Task> assignedToMyTeam = taskRepository.findByAssignedTo_Manager_Id(employeeId);

        Set<Task> combined = new HashSet<>(assignedByMe);
        combined.addAll(assignedToMyTeam);

        return new ArrayList<>(combined);
    }

    public List<Task> getTeamTasks(UUID employeeId) {
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
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
    }

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

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    /**
     * Returns all system-wide flagged tasks, sorted by flaggedAt (newest first).
     * Intended for the Auditor dashboard.
     */
    @Transactional(readOnly = true)
    public List<Task> getFlaggedTasks() {
        return taskRepository.findAllFlaggedTasks();
    }
}