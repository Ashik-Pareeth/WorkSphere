package com.ucocs.worksphere.dto.hiring;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

@Data
public class FinalizeHireRequest {
    private UUID employeeId;
    private String username;
    private Set<UUID> roleIds;
    private UUID managerId;
    private UUID workScheduleId;
    private Double salary;
    private UUID departmentId;
    private UUID jobPositionId;
    private BigDecimal baseSalary;
    private BigDecimal hra;
    private BigDecimal da;
    private BigDecimal travelAllowance;
    private BigDecimal otherAllowances;
    private Double pfEmployeePercent;
    private Double pfEmployerPercent;
    private BigDecimal professionalTax;
    private LocalDate effectiveDate;
}
