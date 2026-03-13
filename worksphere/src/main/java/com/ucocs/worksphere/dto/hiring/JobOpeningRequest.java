package com.ucocs.worksphere.dto.hiring;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class JobOpeningRequest {
    private String title;
    private String description;
    private UUID departmentId;
    private UUID jobPositionId;
    private Integer openSlots;
    private LocalDate closingDate;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
}
