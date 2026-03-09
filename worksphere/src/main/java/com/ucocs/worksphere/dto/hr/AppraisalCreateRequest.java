package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.AppraisalCycleType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class AppraisalCreateRequest {
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    @NotNull(message = "Cycle type is required")
    private AppraisalCycleType cycleType;

    @NotNull(message = "Review period start is required")
    private LocalDate reviewPeriodStart;

    @NotNull(message = "Review period end is required")
    private LocalDate reviewPeriodEnd;
}
