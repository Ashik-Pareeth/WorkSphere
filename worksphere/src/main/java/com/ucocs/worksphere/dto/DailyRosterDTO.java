package com.ucocs.worksphere.dto;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for the Daily Roster view.
 * Flattens attendance + employee data into a safe, serializable record.
 */
public record DailyRosterDTO(
        UUID employeeId,
        String firstName,
        String lastName,
        String jobTitle,
        String dailyStatus,
        LocalDateTime clockIn,
        LocalDateTime clockOut,
        UUID attendanceId,
        Boolean isManuallyAdjusted) {
}
