package com.ucocs.worksphere.dto.hr;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

// ── Request sent by HR / SUPER_ADMIN to take a direct action ─────────────────
public record EmployeeActionRequest(
        UUID employeeId,
        String actionType,       // EmployeeActionType enum name
        String reason,
        LocalDate effectiveDate,
        LocalDate endDate,       // for suspension / forced leave
        String newJobPosition,   // for promotion / demotion / transfer
        String newDepartment,    // for transfer
        BigDecimal newSalary     // for salary revision / promotion
) {}