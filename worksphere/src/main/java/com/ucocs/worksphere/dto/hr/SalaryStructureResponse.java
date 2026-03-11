package com.ucocs.worksphere.dto.hr;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class SalaryStructureResponse {
    private UUID id;
    private BigDecimal baseSalary;
    private BigDecimal hra;
    private BigDecimal da;
    private BigDecimal travelAllowance;
    private BigDecimal otherAllowances;
    private Double pfEmployeePercent;
    private Double pfEmployerPercent;
    private BigDecimal professionalTax;
    private LocalDate effectiveDate;
    private UUID employeeId;
    private String employeeName;
    private UUID jobPositionId;
    private String jobPositionName;
}
