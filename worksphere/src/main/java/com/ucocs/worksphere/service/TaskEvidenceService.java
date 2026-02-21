package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Task;
import com.ucocs.worksphere.entity.TaskEvidence;
import com.ucocs.worksphere.enums.EvidenceStatus;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.TaskEvidenceRepository;
import com.ucocs.worksphere.repository.TaskRepository;
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
import java.util.Objects;
import java.util.UUID;

@Service
@Transactional
public class TaskEvidenceService {

    private final TaskEvidenceRepository taskEvidenceRepository;
    private final TaskRepository taskRepository;
    private final EmployeeRepository employeeRepository;

    public TaskEvidenceService(TaskEvidenceRepository taskEvidenceRepository,
                               TaskRepository taskRepository,
                               EmployeeRepository employeeRepository) {
        this.taskEvidenceRepository = taskEvidenceRepository;
        this.taskRepository = taskRepository;
        this.employeeRepository = employeeRepository;
    }

    public List<TaskEvidence> getTaskEvidence(UUID taskId) {
        return taskEvidenceRepository.findAllByTaskId(taskId);
    }

    public TaskEvidence uploadEvidence(UUID taskId, MultipartFile file) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        Employee currentUser = getCurrentUser();

        if (!task.getAssignedTo().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Only the assigned employee can upload evidence for this task.");
        }

        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

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
        String originalFilename = Paths.get(Objects.requireNonNull(file.getOriginalFilename())).getFileName().toString();
        String uniqueFileName = timeStamp + "_" + originalFilename;

        Path filePath = uploadPath.resolve(uniqueFileName);

        try {
            // Using REPLACE_EXISTING to prevent FileAlreadyExistsException
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store evidence file");
        }

        TaskEvidence evidence = new TaskEvidence();
        evidence.setTask(task);
        evidence.setUploadedBy(currentUser);
        evidence.setFileName(originalFilename);
        evidence.setFileUrl(uploadDir + uniqueFileName);
        evidence.setFileType(file.getContentType());
        evidence.setStatus(EvidenceStatus.PENDING); // Initial state

        return taskEvidenceRepository.save(evidence);
    }

    public TaskEvidence reviewEvidence(UUID evidenceId, EvidenceStatus newStatus, String feedback) {
        TaskEvidence evidence = taskEvidenceRepository.findById(evidenceId)
                .orElseThrow(() -> new ResourceNotFoundException("Evidence not found"));

        // We still need this to attach to the evidence entity below
        Employee currentUser = getCurrentUser();

        // FIX: hasRole now only takes the String role name!
        if (!hasRole("MANAGER") && !hasRole("ADMIN")) {
            throw new AccessDeniedException("Only Managers or Admins can review evidence.");
        }

        evidence.setStatus(newStatus);
        evidence.setReviewFeedback(feedback);
        evidence.setReviewedBy(currentUser);
        evidence.setReviewedAt(LocalDateTime.now());

        return taskEvidenceRepository.save(evidence);
    }



    private Employee getCurrentUser() {
        String username = Objects
                .requireNonNull(SecurityContextHolder.getContext().getAuthentication())
                .getName();
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private boolean hasRole(String roleName) {
        // Ensure the role prefix exists (so passing "ADMIN" or "ROLE_ADMIN" both work)
        String targetRole = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;

        return Objects.requireNonNull(SecurityContextHolder.getContext().getAuthentication()).getAuthorities().stream()
                .anyMatch(auth -> Objects.requireNonNull(auth.getAuthority()).equalsIgnoreCase(targetRole));
    }
}