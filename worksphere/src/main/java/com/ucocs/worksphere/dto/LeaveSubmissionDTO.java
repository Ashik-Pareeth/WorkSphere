package com.ucocs.worksphere.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class LeaveSubmissionDTO {
    private UUID policyId;
    private LocalDate startDate;
    private LocalDate endDate;
    private double requestedDays;
    private String reason;
}