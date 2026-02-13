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
        String assignerName, // Just the name, not the whole object
        String assignedToName
) {
    public static TaskResponseDTO fromEntity(Task task) {
        // Safe check for Assigner
        String assignerName = "Unknown";
        if (task.getAssigner() != null) {
            assignerName = task.getAssigner().getUserName();
            // If you used 'firstName', change 'getUserName()' to 'getFirstName()'
        }

        // Safe check for AssignedTo
        String assignedToName = "Unassigned";
        if (task.getAssignedTo() != null) {
            assignedToName = task.getAssignedTo().getUserName();
        }

        return new TaskResponseDTO(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getTaskCode(),
                assignerName,
                assignedToName
        );
    }
}