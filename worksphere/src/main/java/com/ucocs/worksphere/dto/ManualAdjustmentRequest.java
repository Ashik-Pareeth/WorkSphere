package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.enums.LeaveTransactionType;
import lombok.Data;
import java.util.UUID;

@Data
public class ManualAdjustmentRequest {
    private UUID employeeId;
    private UUID policyId;
    private LeaveTransactionType transactionType;
    private double days;
    private String reason;
}