package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.TaskStatusUpdate;
import com.ucocs.worksphere.entity.*;
import com.ucocs.worksphere.enums.TaskPriority;
import com.ucocs.worksphere.enums.TaskStatus;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final TaskEvidenceRepository taskEvidenceRepository;
    private final TaskHistoryRepository taskHistoryRepository;
    private final TaskCommentRepository taskCommentRepository;

    // --- STATE MACHINE CONFIGURATION ---

    private static final Map<TaskStatus, Set<TaskStatus>> EMPLOYEE_TRANSITIONS = Map.of(
            TaskStatus.TODO, Set.of(TaskStatus.IN_PROGRESS),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.IN_REVIEW),
            TaskStatus.IN_REVIEW, Set.of(),
            TaskStatus.COMPLETED, Set.of(),
            TaskStatus.CANCELLED, Set.of()
    );

    private static final Map<TaskStatus, Set<TaskStatus>> MANAGER_TRANSITIONS = Map.of(
            TaskStatus.TODO, Set.of(TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.IN_REVIEW, TaskStatus.COMPLETED, TaskStatus.TODO, TaskStatus.CANCELLED),
            TaskStatus.IN_REVIEW, Set.of(TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED),
            TaskStatus.COMPLETED, Set.of(TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED),
            TaskStatus.CANCELLED, Set.of(TaskStatus.TODO, TaskStatus.IN_PROGRESS)
    );

    public TaskService(TaskRepository taskRepository, EmployeeRepository employeeRepository,
                       TaskEvidenceRepository taskEvidenceRepository, TaskHistoryRepository taskHistoryRepository,
                       TaskCommentRepository taskCommentRepository) {
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
        this.taskEvidenceRepository = taskEvidenceRepository;
        this.taskHistoryRepository = taskHistoryRepository;
        this.taskCommentRepository = taskCommentRepository;
    }

    public Task createTask(Task task, UUID managerId, UUID assignedToId) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        Employee assignee = employeeRepository.findById(assignedToId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));

        task.setAssigner(manager);
        task.setAssignedTo(assignee);
        task.setCreatedAt(LocalDateTime.now());
        task.setUpdatedAt(LocalDateTime.now());
        task.setStatus(TaskStatus.TODO);

        long count = taskRepository.count();
        task.setTaskCode("TSK-" + (1000 + count + 1));

        task.setCompletionScore(0.0);
        task.setOverdue(false);
        task.setFlagged(false);

        Task savedTask = taskRepository.save(task);

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

        boolean isAdmin = hasRole(currentUser, "ROLE_ADMIN");
        boolean isManager = hasRole(currentUser, "ROLE_MANAGER");

        if (!isAdmin) {
            Map<TaskStatus, Set<TaskStatus>> allowedTransitions = isManager ? MANAGER_TRANSITIONS : EMPLOYEE_TRANSITIONS;
            if (!allowedTransitions.getOrDefault(oldStatus, Set.of()).contains(newStatus)) {
                throw new IllegalStateException("Invalid status transition from " + oldStatus + " to " + newStatus);
            }
        } else {
            task.setSystemOverridden(true);
        }

        // Evidence Gatekeeper
        if (!isAdmin && !isManager && newStatus == TaskStatus.IN_REVIEW) {
            if ((task.getPriority() == TaskPriority.HIGH || task.getPriority() == TaskPriority.URGENT)
                    && task.isRequiresEvidence()) {

                boolean hasEvidence = taskEvidenceRepository.existsByTask_Id(taskId);
                if (!hasEvidence) {
                    throw new IllegalStateException("Evidence is mandatory for HIGH/URGENT tasks.");
                }
            }
        }

        task.setStatus(newStatus);
        task.setUpdatedAt(LocalDateTime.now());

        if (newStatus == TaskStatus.COMPLETED) {
            handleCompletion(task);
        } else if (oldStatus == TaskStatus.COMPLETED) {
            handleReopening(task);
        }

        Task savedTask = taskRepository.save(task);

        String roleSnapshot = isAdmin ? "ROLE_ADMIN" : (isManager ? "ROLE_MANAGER" : "ROLE_EMPLOYEE");
        logHistory(savedTask, currentUser, updateDTO.comment(), roleSnapshot, oldStatus, newStatus);

        return savedTask;
    }

    private void handleCompletion(Task task) {
        task.setCompletedAt(LocalDateTime.now());

        double timeScore = 0.0;
        if (task.getDueDate() == null || !task.getCompletedAt().isAfter(task.getDueDate())) {
            timeScore = 50.0;
            task.setOverdue(false);
        } else {
            task.setOverdue(true);
        }

        double qualityScore = (task.getManagerRating() != null) ? (task.getManagerRating() * 10.0) : 0.0;
        task.setCompletionScore(timeScore + qualityScore);
    }

    private void handleReopening(Task task) {
        task.setCompletedAt(null);
        task.setCompletionScore(0.0);
        task.setOverdue(false);
        task.setManagerRating(null);
    }

    public Task rateTask(UUID taskId, Integer rating) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee currentUser = getCurrentUser();
        if (!hasRole(currentUser, "ROLE_MANAGER") && !hasRole(currentUser, "ROLE_ADMIN")) {
            throw new AccessDeniedException("Only Managers can rate tasks.");
        }

        task.setManagerRating(rating);

        if (task.getStatus() == TaskStatus.COMPLETED) {
            double baseScore = task.isOverdue() ? 0.0 : 50.0;
            task.setCompletionScore(baseScore + (rating * 10.0));
        }

        return taskRepository.save(task);
    }

    public Task flagTask(UUID taskId, String reason) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee currentUser = getCurrentUser();
        if (!hasRole(currentUser, "ROLE_AUDITOR") && !hasRole(currentUser, "ROLE_ADMIN")) {
            throw new AccessDeniedException("Only Auditors can flag tasks.");
        }

        task.setFlagged(true);
        task.setFlagReason(reason);

        logHistory(task, currentUser, "Flagged: " + reason, "ROLE_AUDITOR", task.getStatus(), task.getStatus());

        return taskRepository.save(task);
    }

    // --- READ OPERATIONS ---

    public List<Task> getMyTasks(UUID employeeId) {
        return taskRepository.findByAssignedTo_Id(employeeId);
    }

    public List<Task> getTeamTasks(UUID managerId) {
        Employee manager = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));
        return taskRepository.findAllByDepartmentId(manager.getDepartment().getId());
    }

    public List<Task> getTasksByManager(UUID managerId) {
        return taskRepository.findByAssigner_Id(managerId);
    }

    public List<TaskComment> getTaskComments(UUID taskId) {
        return taskCommentRepository.findByTask_IdOrderByCreatedAtAsc(taskId);
    }

    // --- NEW: Missing method needed by Controller ---
    public List<TaskEvidence> getTaskEvidence(UUID taskId) {
        return taskEvidenceRepository.findAllByTaskId(taskId);
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

    // --- EVIDENCE UPLOAD (Fixed) ---

    public TaskEvidence uploadEvidence(UUID taskId, MultipartFile file) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee currentUser = getCurrentUser();

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // 1. Storage Logic
        String uploadDir = "uploads/evidence/";
        Path uploadPath = Paths.get(uploadDir);
        try {
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory");
        }

        String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        // Clean the filename to remove paths or dangerous chars
        String originalFilename = Paths.get(file.getOriginalFilename()).getFileName().toString();
        String uniqueFileName = timeStamp + "_" + originalFilename;

        Path filePath = uploadPath.resolve(uniqueFileName);

        try {
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store evidence file");
        }

        // 2. Save Entity (Now correctly sets fileName)
        TaskEvidence evidence = new TaskEvidence();
        evidence.setTask(task);
        evidence.setUploadedBy(currentUser);
        evidence.setFileName(originalFilename); // <--- FIXED: Now stores the original name
        evidence.setFileUrl(uploadDir + uniqueFileName); // <--- FIXED: Stores full relative path
        evidence.setFileType(file.getContentType());

        return taskEvidenceRepository.save(evidence);
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
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean hasRole(Employee employee, String roleName) {
        return employee.getRoles().stream()
                .anyMatch(r -> r.getRoleName().equals(roleName));
    }
}