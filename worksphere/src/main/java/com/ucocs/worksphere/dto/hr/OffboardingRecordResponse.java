package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.OffboardingReason;
import com.ucocs.worksphere.enums.OffboardingStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class OffboardingRecordResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private OffboardingReason reason;
    private OffboardingStatus status;
    private LocalDate lastWorkingDay;
    private LocalDateTime initiatedAt;
    private String remarks;
    private Boolean itClearance;
    private Boolean hrClearance;
    private Boolean financeClearance;
}
