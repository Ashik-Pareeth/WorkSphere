package com.ucocs.worksphere.dto.hr;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record EmployeeActionResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        UUID initiatedById,
        String initiatedByName,
        String initiatedByRole,   // MANAGER / HR / SUPER_ADMIN
        UUID reviewedById,
        String reviewedByName,
        String actionType,
        String status,
        String reason,
        String reviewNotes,
        LocalDate effectiveDate,
        LocalDate endDate,
        String newJobPosition,
        String newDepartment,
        BigDecimal newSalary,
        String previousJobPosition,
        String previousDepartment,
        BigDecimal previousSalary,
        LocalDateTime createdAt,
        String createdBy,
        LocalDateTime updatedAt,
        String updatedBy
) {}