package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.EmployeeActionStatus;
import com.ucocs.worksphere.enums.EmployeeActionType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Tracks every formal action taken on an employee:
 *  - HR / Super Admin: promotions, demotions, suspensions, forced leave, etc.
 *  - Manager: reports / suggestions that HR then reviews.
 */
@Getter
@Setter
@Entity
@Table(name = "employee_action_records")
public class EmployeeActionRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    /** The person who created this record (HR, SUPER_ADMIN, or MANAGER). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "initiated_by_id", nullable = false)
    private Employee initiatedBy;

    /** HR who reviewed a manager report (null for direct HR actions). */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    private Employee reviewedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmployeeActionType actionType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmployeeActionStatus status;

    /** Human-readable reason / notes for this action. */
    @Column(columnDefinition = "TEXT")
    private String reason;

    /** HR review notes for manager reports. */
    @Column(columnDefinition = "TEXT")
    private String reviewNotes;

    // ── Optional contextual fields ────────────────────────────────────────────

    /** Effective date of the action (e.g. promotion start). */
    private LocalDate effectiveDate;

    /** End date for timed actions like suspension or forced leave. */
    private LocalDate endDate;

    /** New job position name (for PROMOTION / DEMOTION / TRANSFER). */
    private String newJobPosition;

    /** New department name (for TRANSFER). */
    private String newDepartment;

    /** Revised salary amount (for SALARY_REVISION / PROMOTION). */
    private BigDecimal newSalary;

    /** Previous job position snapshot (for audit trail). */
    private String previousJobPosition;

    /** Previous department snapshot. */
    private String previousDepartment;

    /** Previous salary snapshot. */
    private BigDecimal previousSalary;
}