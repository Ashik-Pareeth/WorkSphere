package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.enums.TaskStatus;

public record TaskStatusUpdate(
        TaskStatus status,
        String comment,        // Optional: Rejection reason or "Done" note
        Integer actualHours    // Optional: "I spent 4 hours on this"
) {}