package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.PayrollStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PayrollRecordResponse {
    private UUID id;
    private UUID employeeId;
    private String employeeName;
    private String department;
    private Integer month;
    private Integer year;
    private Integer workingDays;
    private Integer presentDays;
    private Integer lopDays;
    private BigDecimal grossPay;
    private BigDecimal lopDeduction;
    private BigDecimal pfDeduction;
    private BigDecimal taxDeduction;
    private BigDecimal professionalTax;
    private BigDecimal otherDeductions;
    private BigDecimal overtimePay;
    private BigDecimal netPay;
    private PayrollStatus status;
    private LocalDateTime processedAt;
    private String payslipDownloadUrl;
}
