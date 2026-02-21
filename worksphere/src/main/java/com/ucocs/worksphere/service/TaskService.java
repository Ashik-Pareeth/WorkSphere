package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.TaskCreateRequest;
import com.ucocs.worksphere.dto.TaskStatusUpdate;
import com.ucocs.worksphere.entity.*;
import com.ucocs.worksphere.enums.EvidenceStatus;
import com.ucocs.worksphere.enums.TaskPriority;
import com.ucocs.worksphere.enums.TaskStatus;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final TaskEvidenceRepository taskEvidenceRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final TaskCommentRepository taskCommentRepository;

    public TaskService(TaskRepository taskRepository, EmployeeRepository employeeRepository,
                       TaskEvidenceRepository taskEvidenceRepository, TaskHistoryRepository taskHistoryRepository,
                       TaskCommentRepository taskCommentRepository) {
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
        this.taskEvidenceRepository = taskEvidenceRepository;
        this.taskHistoryRepository = taskHistoryRepository;
        this.taskCommentRepository = taskCommentRepository;
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
                priorityEnum
        );

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

        if (oldStatus == newStatus) return task;

        boolean isAdmin = hasRole(currentUser, "ADMIN");
        boolean isManager = hasRole(currentUser, "MANAGER");
        boolean hasOversight = isAdmin || isManager;

        // --- ROLE PROTECTIONS ---
        if ((newStatus == TaskStatus.COMPLETED || newStatus == TaskStatus.CANCELLED) && !hasOversight) {
            throw new AccessDeniedException("Only Managers and Admins can complete or cancel tasks.");
        }

        // --- WIP LIMIT ENFORCEMENT ---
        if (newStatus == TaskStatus.IN_PROGRESS && !hasOversight) { // Managers can bypass WIP limits if needed
            long currentWip = taskRepository.countByAssignedTo_IdAndStatus(task.getAssignedTo().getId(), TaskStatus.IN_PROGRESS);
            if (currentWip >= 3) {
                throw new IllegalStateException("WIP Limit Reached: You already have 3 tasks in progress. Finish one first.");
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
                // If a manager kicks it back all the way to TODO from a higher state
                if (hasOversight) task.kickBackToInProgress(); // Adjust based on your business logic
            }
        }

        if (isAdmin) {
            task.overrideSystem();
        }

        Task savedTask = taskRepository.save(task);

        String roleSnapshot = isAdmin ? "ROLE_ADMIN" : (isManager ? "ROLE_MANAGER" : "ROLE_EMPLOYEE");
        logHistory(savedTask, currentUser, updateDTO.comment(), roleSnapshot, oldStatus, newStatus);

        return taskRepository.findByIdWithRelations(taskId)
                .orElseThrow(() -> new IllegalStateException("Task vanished after saving!"));    }

    public Task rateTask(UUID taskId, Integer rating) {
        Task task = taskRepository.findByIdWithRelations(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee currentUser = getCurrentUser();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        assert auth != null;
        System.out.println("Authorities: " + auth.getAuthorities());
        System.out.println("Current user role from DB: " + currentUser.getRoles());
        if (!hasRole(currentUser, "MANAGER") && !hasRole(currentUser, "ADMIN")) {
            throw new AccessDeniedException("Only Managers can rate tasks.");
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
        task.flagForAudit(reason);

        logHistory(task, currentUser, "Flagged: " + reason, "ROLE_AUDITOR", task.getStatus(), task.getStatus());

        return taskRepository.save(task);
    }

    // --- READ OPERATIONS ---

    public List<Task> getMyTasks(UUID employeeId) {
        return taskRepository.findByAssignedTo_Id(employeeId);
    }

    public List<Task> getTeamTasks(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Ask Spring Security for your roles directly from the authenticated token
        boolean isGlobalViewer = Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getAuthorities().stream()
                .anyMatch(a -> {
                    String role = a.getAuthority();
                    assert role != null;
                    return role.equals("ROLE_ADMIN") || role.equals("ROLE_HR") || role.equals("ROLE_AUDITOR");
                });

        if (isGlobalViewer) {
            return taskRepository.findAllWithRelations();
        }

        // If not a global viewer, they must be a Manager. Give them their department's tasks.
        if (employee.getDepartment() == null) {
            return List.of();
        }

        return taskRepository.findAllByDepartmentId(employee.getDepartment().getId());
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
                comment
        );
        taskHistoryRepository.save(history);
    }

    private Employee getCurrentUser() {
        String username = Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getName();
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean hasRole(Employee employee, String roleName) {
        employee.getRoles().forEach(r ->
                System.out.println("DB ROLE = " + r.getRoleName())
        );
        return employee.getRoles().stream()
                .anyMatch(r -> r.getRoleName().equals(roleName));
    }
}