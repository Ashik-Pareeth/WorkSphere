package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.TaskCommentResponseDTO;
import com.ucocs.worksphere.dto.TaskCreateRequest;
import com.ucocs.worksphere.dto.TaskResponseDTO;
import com.ucocs.worksphere.entity.Task;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.TaskComment;
import com.ucocs.worksphere.enums.TaskPriority;
import com.ucocs.worksphere.enums.TaskStatus;
import com.ucocs.worksphere.repository.EmployeeRepository; // Needed to resolve Manager
import com.ucocs.worksphere.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "http://localhost:5173") // or "*"
public class TaskController {

    private final TaskService taskService;
    private final EmployeeRepository employeeRepository;

    public TaskController(TaskService taskService, EmployeeRepository employeeRepository) {
        this.taskService = taskService;
        this.employeeRepository = employeeRepository;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<TaskResponseDTO> createTask(@RequestBody TaskCreateRequest request) { // Change return type
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Employee manager = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));

        Task task = new Task();
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setDueDate(request.dueDate());
        task.setRequiresEvidence(request.requiresEvidence());

        try {
            task.setPriority(TaskPriority.valueOf(request.priority()));
        } catch (IllegalArgumentException e) {
            task.setPriority(TaskPriority.MEDIUM);
        }

        Task createdTask = taskService.createTask(
                task,
                manager.getId(),
                request.assignedToId()
        );

        // CONVERT TO DTO BEFORE RETURNING
        return ResponseEntity.ok(TaskResponseDTO.fromEntity(createdTask));
    }

    @GetMapping("/my-tasks")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TaskResponseDTO>> getMyTasks() {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Employee employee = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Task> tasks = taskService.getMyTasks(employee.getId());

        // 3. CONVERT the list before returning
        List<TaskResponseDTO> response = tasks.stream()
                .map(TaskResponseDTO::fromEntity) // <--- usage of the helper method
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }
    @PatchMapping("/{taskId}/status")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'EMPLOYEE')") // Employees need to mark tasks as "In Progress"
    public ResponseEntity<TaskResponseDTO> updateTaskStatus(
            @PathVariable UUID taskId,
            @RequestParam TaskStatus status) {

        Task updatedTask = taskService.updateTaskStatus(taskId, status);
        return ResponseEntity.ok(TaskResponseDTO.fromEntity(updatedTask));
    }
    @GetMapping("/assigned-by-me")
    public ResponseEntity<List<Task>> getTasksAssignedByMe() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Employee manager = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return ResponseEntity.ok(taskService.getTasksByManager(manager.getId()));
    }
    @GetMapping("/{taskId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TaskCommentResponseDTO>> getTaskComments(@PathVariable UUID taskId) {
        List<TaskComment> comments = taskService.getTaskComments(taskId);
        List<TaskCommentResponseDTO> response = comments.stream()
                .map(TaskCommentResponseDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{taskId}/comments")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TaskCommentResponseDTO> addComment(
            @PathVariable UUID taskId,
            @RequestBody String content) {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Employee employee = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        TaskComment savedComment = taskService.addComment(taskId, employee.getId(), content);

        return ResponseEntity.ok(TaskCommentResponseDTO.fromEntity(savedComment));
    }
}