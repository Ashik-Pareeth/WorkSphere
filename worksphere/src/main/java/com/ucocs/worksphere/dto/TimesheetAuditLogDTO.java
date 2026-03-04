package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.TimesheetAuditLog;
import java.time.Instant;
import java.util.UUID;

public record TimesheetAuditLogDTO(
        UUID id,
        UUID attendanceId,
        EmployeeSummary changedBy,
        Instant changeTimestamp,
        String fieldChanged,
        String oldValue,
        String newValue,
        String reason) {

    public record EmployeeSummary(UUID id, String firstName, String lastName) {
    }

    public static TimesheetAuditLogDTO fromEntity(TimesheetAuditLog log) {
        return new TimesheetAuditLogDTO(
                log.getId(),
                log.getAttendance() != null ? log.getAttendance().getId() : null,
                log.getChangedBy() != null
                        ? new EmployeeSummary(log.getChangedBy().getId(), log.getChangedBy().getFirstName(),
                                log.getChangedBy().getLastName())
                        : null,
                log.getChangeTimestamp(),
                log.getFieldChanged(),
                log.getOldValue(),
                log.getNewValue(),
                log.getReason());
    }
}
