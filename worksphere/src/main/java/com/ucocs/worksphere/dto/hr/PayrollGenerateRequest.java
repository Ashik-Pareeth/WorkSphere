package com.ucocs.worksphere.dto.hr;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
public class PayrollGenerateRequest {

    @NotNull
    @Min(1)
    @Max(12)
    private Integer month;

    @NotNull
    @Min(2020)
    private Integer year;

    /**
     * Optional. If null, generate for all active employees.
     */
    private List<UUID> employeeIds;
}
