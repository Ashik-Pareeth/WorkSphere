package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.LeaveTransactionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "leave_transactions")
public class LeaveTransaction extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private LeavePolicy leavePolicy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveTransactionType transactionType;

    @Column(nullable = false)
    private Double daysChanged; // e.g., +1.5 or -3.0

    @Column(nullable = false, length = 255)
    private String reason; // "Monthly Accrual", "Approved Vacation", "HR Correction"

    // Optional reference: If this deduction was caused by an approved request, link it!
    // (We will create the LeaveRequest entity in Phase 4)
    @Column(name = "reference_request_id", nullable = true)
    private String referenceRequestId;
}