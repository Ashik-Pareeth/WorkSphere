package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.AppraisalCycleType;
import com.ucocs.worksphere.enums.AppraisalStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class AppraisalResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private UUID managerId;
    private String managerName;
    private AppraisalCycleType cycleType;
    private AppraisalStatus status;
    private LocalDate reviewPeriodStart;
    private LocalDate reviewPeriodEnd;
    private Integer tasksCompletedInPeriod;
    private Integer tasksOverdueInPeriod;
    private BigDecimal averageTaskScore;
    private BigDecimal selfRating;
    private BigDecimal managerRating;
    private String selfComments;
    private String managerComments;
    private String hrComments;
    private BigDecimal finalScore;
}
