package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.*;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Task;
import com.ucocs.worksphere.entity.TaskComment;
import com.ucocs.worksphere.entity.TaskEvidence;
import com.ucocs.worksphere.enums.EvidenceStatus;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.service.TaskEvidenceService;
import com.ucocs.worksphere.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {

    private final TaskService taskService;
    private final TaskEvidenceService taskEvidenceService;
    private final EmployeeRepository employeeRepository;

    public TaskController(
            TaskService taskService,
            EmployeeRepository employeeRepository,
            TaskEvidenceService taskEvidenceService)
    {
        this.taskService = taskService;
        this.employeeRepository = employeeRepository;
        this.taskEvidenceService = taskEvidenceService;
    }

    // --- 1. CREATE TASK ---
    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<TaskResponseDTO> createTask(@RequestBody TaskCreateRequest request) {
        Employee manager = getAuthenticatedEmployee();

        // FIX: Just pass the request DTO straight to the service!
        Task createdTask = taskService.createTask(request, manager.getId());

        return ResponseEntity.ok(TaskResponseDTO.fromEntity(createdTask));
    }

    // --- 2. UPDATE STATUS ---
    @PatchMapping("/{taskId}/status")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TaskResponseDTO> updateTaskStatus(
            @PathVariable UUID taskId,
            @RequestBody TaskStatusUpdate updateDTO) {

        Task updatedTask = taskService.updateTaskStatus(taskId, updateDTO);
        return ResponseEntity.ok(TaskResponseDTO.fromEntity(updatedTask));
    }

    // --- 3. READ OPERATIONS ---
    @GetMapping("/my-tasks")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TaskResponseDTO>> getMyTasks() {
        Employee employee = getAuthenticatedEmployee();
        List<Task> tasks = taskService.getMyTasks(employee.getId());
        return ResponseEntity.ok(convertToDTOs(tasks));
    }

    @GetMapping("/team-tasks")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN', 'HR')")
    public ResponseEntity<List<TaskResponseDTO>> getTeamTasks() {
        Employee manager = getAuthenticatedEmployee();
        List<Task> tasks = taskService.getTeamTasks(manager.getId());
        return ResponseEntity.ok(convertToDTOs(tasks));
    }

    // --- 4. COMMENTS ---
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
            @RequestBody TaskCommentRequest request) {

        Employee employee = getAuthenticatedEmployee();
        TaskComment savedComment = taskService.addComment(taskId, employee.getId(), request.content());
        return ResponseEntity.ok(TaskCommentResponseDTO.fromEntity(savedComment));
    }

    // --- 5. EVIDENCE (FILES) ---
    @PostMapping(value = "/{taskId}/evidence", consumes = "multipart/form-data")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TaskEvidence> uploadEvidence(
            @PathVariable UUID taskId,
            @RequestParam("file") MultipartFile file) {

        TaskEvidence evidence = taskEvidenceService.uploadEvidence(taskId, file);
        return ResponseEntity.ok(evidence);
    }

    @GetMapping("/{taskId}/evidence")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TaskEvidence>> getTaskEvidence(@PathVariable UUID taskId) {
        return ResponseEntity.ok(taskEvidenceService.getTaskEvidence(taskId));
    }

    @PatchMapping("/evidence/{evidenceId}/review")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<TaskEvidence> reviewEvidence(
            @PathVariable UUID evidenceId,
            @RequestParam EvidenceStatus status,
            @RequestParam(required = false) String feedback) {

        TaskEvidence reviewedEvidence = taskEvidenceService.reviewEvidence(evidenceId, status, feedback);
        return ResponseEntity.ok(reviewedEvidence);
    }

    // --- 6. RATING & FLAGGING ---
    @PostMapping("/{taskId}/rate")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<TaskResponseDTO> rateTask(
            @PathVariable UUID taskId,
            @RequestBody TaskRatingRequest request) {

        Task task = taskService.rateTask(taskId, request.rating());
        return ResponseEntity.ok(TaskResponseDTO.fromEntity(task));
    }

    @PostMapping("/{taskId}/flag")
    @PreAuthorize("hasAnyRole('AUDITOR', 'ADMIN')")
    public ResponseEntity<TaskResponseDTO> flagTask(
            @PathVariable UUID taskId,
            @RequestBody String reason) {

        Task task = taskService.flagTask(taskId, reason);
        return ResponseEntity.ok(TaskResponseDTO.fromEntity(task));
    }

    // --- HELPERS ---
    private Employee getAuthenticatedEmployee() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private List<TaskResponseDTO> convertToDTOs(List<Task> tasks) {
        return tasks.stream()
                .map(TaskResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }
}