package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.Task;
import com.ucocs.worksphere.enums.TaskPriority;
import com.ucocs.worksphere.enums.TaskStatus;
import java.time.LocalDateTime;
import java.util.UUID;

public record TaskResponseDTO(
        UUID id,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDateTime dueDate,
        String taskCode,
        String assignerName,
        String assignedToName,

        // --- NEW FIELDS ---
        boolean requiresEvidence,
        Double completionScore,
        Integer managerRating,
        boolean isOverdue,
        boolean isFlagged,      // For Auditor
        String flagReason       // Reason for flagging
) {
    public static TaskResponseDTO fromEntity(Task task) {
        String assignerName = (task.getAssigner() != null) ? task.getAssigner().getUserName() : "Unknown";
        String assignedToName = (task.getAssignedTo() != null) ? task.getAssignedTo().getUserName() : "Unassigned";

        return new TaskResponseDTO(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getTaskCode(),
                assignerName,
                assignedToName,
                // Map new fields
                task.isRequiresEvidence(),
                task.getCompletionScore(),
                task.getManagerRating(),
                task.isOverdue(),
                task.isFlagged(),
                task.getFlagReason()
        );
    }
}