package com.ucocs.worksphere.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record TaskCreateRequest(
        String title,
        String description,
        String priority, // "HIGH", "MEDIUM", etc.
        UUID assignedToId,
        UUID projectId, // Optional
        LocalDateTime dueDate,
        boolean requiresEvidence
) {}