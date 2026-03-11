package com.ucocs.worksphere.dto.hr;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class SalaryStructureRequest {

    @NotNull
    private BigDecimal baseSalary;

    private BigDecimal hra = BigDecimal.ZERO;
    private BigDecimal da = BigDecimal.ZERO;
    private BigDecimal travelAllowance = BigDecimal.ZERO;
    private BigDecimal otherAllowances = BigDecimal.ZERO;
    private Double pfEmployeePercent = 12.0;
    private Double pfEmployerPercent = 12.0;
    private BigDecimal professionalTax = BigDecimal.ZERO;

    @NotNull
    private LocalDate effectiveDate;

    /**
     * Set one of these. If employeeId is set, creates a per-employee override.
     * If jobPositionId is set, creates a position-level default.
     */
    private UUID employeeId;
    private UUID jobPositionId;
}
