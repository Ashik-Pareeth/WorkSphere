package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.OffboardingReason;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class OffboardingInitiateRequest {
    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    @NotNull(message = "Reason is required")
    private OffboardingReason reason;

    @NotNull(message = "Last working day is required")
    private LocalDate lastWorkingDay;

    private String remarks;
}
