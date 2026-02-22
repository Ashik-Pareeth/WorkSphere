package com.ucocs.worksphere.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "leave_balances")
public class LeaveBalance extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private LeavePolicy leavePolicy;

    @Column(nullable = false)
    private Integer validForYear; // e.g., 2026

    @Column(nullable = false)
    private Double daysAllocated = 0.0; // Total days they *could* take

    @Column(nullable = false)
    private Double daysUsed = 0.0;      // Days they have already taken

    @Column(nullable = false)
    private Double daysAvailable = 0.0; // (Allocated - Used) - keeping this materialized for fast reads
}