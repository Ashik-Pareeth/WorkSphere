package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Task;
import com.ucocs.worksphere.entity.TaskComment;
import com.ucocs.worksphere.enums.TaskStatus;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.TaskCommentRepository;
import com.ucocs.worksphere.repository.TaskRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;
    private final TaskCommentRepository taskCommentRepository;

    // Defines allowed status transitions for Managers/Admins (Flexible FSM)
    private static final Map<TaskStatus, Set<TaskStatus>> MANAGER_TRANSITIONS = Map.of(
            TaskStatus.TODO, Set.of(TaskStatus.IN_PROGRESS, TaskStatus.COMPLETED, TaskStatus.CANCELLED),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.IN_REVIEW, TaskStatus.TODO, TaskStatus.COMPLETED, TaskStatus.CANCELLED),
            TaskStatus.IN_REVIEW, Set.of(TaskStatus.COMPLETED, TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED),
            TaskStatus.COMPLETED, Set.of(TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED),
            TaskStatus.CANCELLED, Set.of(TaskStatus.TODO)
    );

    // Defines allowed status transitions for standard Employees (Strict Linear FSM)
    private static final Map<TaskStatus, Set<TaskStatus>> EMPLOYEE_TRANSITIONS = Map.of(
            TaskStatus.TODO, Set.of(TaskStatus.IN_PROGRESS),
            TaskStatus.IN_PROGRESS, Set.of(TaskStatus.IN_REVIEW),
            TaskStatus.IN_REVIEW, Set.of(),
            TaskStatus.COMPLETED, Set.of(),
            TaskStatus.CANCELLED, Set.of()
    );

    public TaskService(TaskRepository taskRepository, EmployeeRepository employeeRepository,
                       TaskCommentRepository taskCommentRepository) {
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
        this.taskCommentRepository = taskCommentRepository;
    }

    public Task createTask(Task task, UUID assignerId, UUID assigneeId) {
        Employee assigner = employeeRepository.findById(assignerId)
                .orElseThrow(() -> new ResourceNotFoundException("Assigner not found"));
        Employee assignee = employeeRepository.findById(assigneeId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));

        task.setAssigner(assigner);
        task.setAssignedTo(assignee);
        task.setTaskCode(generateNextTaskCode());

        if (task.getStatus() == null) {
            task.setStatus(TaskStatus.TODO);
        }

        return taskRepository.save(task);
    }

    public List<Task> getMyTasks(UUID employeeId) {
        return taskRepository.findByAssignedTo_Id(employeeId);
    }

    public List<Task> getTasksByManager(UUID managerId) {
        return taskRepository.findByAssigner_Id(managerId);
    }

    private String generateNextTaskCode() {
        return taskRepository.findTopByOrderByCreatedAtDesc()
                .map(lastTask -> {
                    String code = lastTask.getTaskCode();
                    int number = Integer.parseInt(code.substring(4));
                    return "TSK-" + (number + 1);
                })
                .orElse("TSK-100");
    }

    public Task updateTaskStatus(UUID taskId, TaskStatus newStatus) {
        Task task = taskRepository.findByIdWithRelations(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        TaskStatus currentStatus = task.getStatus();

        if (currentStatus == newStatus) {
            return task;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assert authentication != null;

        boolean isPrivilegedUser = authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(Objects::nonNull)
                .anyMatch(role -> role.equals("ROLE_MANAGER") || role.equals("ROLE_ADMIN") || role.equals("ROLE_HR"));

        // Select the appropriate state machine based on user role
        Map<TaskStatus, Set<TaskStatus>> allowedTransitions = isPrivilegedUser ? MANAGER_TRANSITIONS : EMPLOYEE_TRANSITIONS;
        Set<TaskStatus> validNextStates = allowedTransitions.getOrDefault(currentStatus, Set.of());

        if (!validNextStates.contains(newStatus)) {
            throw new IllegalStateException(
                    String.format("Invalid workflow transition. Cannot move task from %s to %s.", currentStatus, newStatus)
            );
        }

        task.setStatus(newStatus);

        // Manage completion metrics based on state changes
        if (newStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(java.time.LocalDateTime.now());
            task.setCompletionScore(100.0);
        } else if (currentStatus == TaskStatus.COMPLETED) {
            task.setCompletedAt(null);
            task.setCompletionScore(0.0);
        }

        return taskRepository.save(task);
    }

    public List<TaskComment> getTaskComments(UUID taskId) {
        return taskCommentRepository.findByTask_IdOrderByCreatedAtAsc(taskId);
    }

    public TaskComment addComment(UUID taskId, UUID authorId, String content) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        Employee author = employeeRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("Author not found"));

        TaskComment comment = new TaskComment();
        comment.setTask(task);
        comment.setAuthor(author);
        comment.setContent(content);

        return taskCommentRepository.save(comment);
    }
}