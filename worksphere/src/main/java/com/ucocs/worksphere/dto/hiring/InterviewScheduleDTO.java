package com.ucocs.worksphere.dto.hiring;

import java.time.LocalDateTime;
import java.util.UUID;

public record InterviewScheduleDTO(
        UUID id,
        int roundNumber,
        com.ucocs.worksphere.enums.InterviewMode mode,
        String status,
        LocalDateTime scheduledAt,
        String interviewerFirstName,
        Integer score,
        String feedback
) {}