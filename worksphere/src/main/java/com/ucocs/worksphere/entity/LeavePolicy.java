package com.ucocs.worksphere.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
@Entity
@Table(name = "leave_policies")
public class LeavePolicy extends BaseEntity {

    @Column(nullable = false, unique = true, length = 100)
    private String name; // e.g., "Standard PTO 2026"

    @Column(nullable = false)
    private Double defaultAnnualAllowance; // e.g., 14.0 days

    @Column(nullable = false)
    private Boolean allowsCarryForward; // Can they roll over to next year?

    @Column(nullable = false)
    private Double maxCarryForwardDays = 0.0;

    @Column(nullable = false)
    private Boolean isUnpaid = false;
}