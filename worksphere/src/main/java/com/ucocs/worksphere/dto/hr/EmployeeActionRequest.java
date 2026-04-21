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
        BigDecimal newSalary,    // For gross logging fallback
        BigDecimal baseSalary,
        BigDecimal hra,
        BigDecimal da,
        BigDecimal travelAllowance,
        BigDecimal otherAllowances,
        Double pfEmployeePercent,
        Double pfEmployerPercent,
        BigDecimal professionalTax
) {}