package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.Task;
import java.time.LocalDateTime;
import java.util.UUID;

public record TaskResponseDTO(
        UUID id,
        String taskCode,
        String title,
        String description,
        String status,
        String priority,
        LocalDateTime dueDate,
        Double completionScore,
        Integer managerRating,
        boolean requiresEvidence,
        boolean isOverdue,
        boolean isFlagged,
        String flagReason,
        String assignerName,
        String assignedToName,
        UUID assignedToId // <--- NEW: Add this!
) {
    public static TaskResponseDTO fromEntity(Task task) {
        return new TaskResponseDTO(
                task.getId(),
                task.getTaskCode(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus() != null ? task.getStatus().name() : null,
                task.getPriority() != null ? task.getPriority().name() : null,
                task.getDueDate(),
                task.getCompletionScore(),
                task.getManagerRating(),
                task.isRequiresEvidence(),
                task.isOverdue(),
                task.isFlagged(),
                task.getFlagReason(),
                task.getAssigner() != null ? task.getAssigner().getUserName() : null,
                task.getAssignedTo() != null ? task.getAssignedTo().getUserName() : null,
                task.getAssignedTo() != null ? task.getAssignedTo().getId() : null // <--- NEW: Pull the ID!
        );
    }
}