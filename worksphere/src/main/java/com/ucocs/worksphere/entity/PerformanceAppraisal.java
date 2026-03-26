package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.AppraisalCycleType;
import com.ucocs.worksphere.enums.AppraisalStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "performance_appraisals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class PerformanceAppraisal extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee manager;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppraisalCycleType cycleType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppraisalStatus status;

    @Column(nullable = false)
    private LocalDate reviewPeriodStart;

    @Column(nullable = false)
    private LocalDate reviewPeriodEnd;

    /* Metrics populated from Task completion history */
    @Builder.Default
    @Column(nullable = false)
    private Integer tasksCompletedInPeriod = 0;

    @Builder.Default
    @Column(nullable = false)
    private Integer tasksOverdueInPeriod = 0;

    @Column(precision = 4, scale = 2)
    private BigDecimal averageTaskScore;

    /* Attendance metrics  snapshotted from Attendance module at appraisal creation.
     * These give the manager objective punctuality/reliability context during review.
     *
     * Status breakdown (set by AttendanceService on clock-in/out, and MidnightAbsenteeJob):
     *   PRESENT     → clocked in within grace period
     *   LATE        → clocked in but past grace period
     *   ABSENT      → never clocked in AND no approved leave
     *   ON_LEAVE    → never clocked in BUT has an approved leave request (MidnightAbsenteeJob)
     *   HALF_DAY_*  → clocked in/out but worked < 100% of shift (set on clock-out)
     */
    @Builder.Default
    @Column(nullable = false)
    private Integer presentDaysInPeriod = 0;   // PRESENT only — on time

    @Builder.Default
    @Column(nullable = false)
    private Integer lateDaysInPeriod = 0;       // LATE — arrived past grace period

    @Builder.Default
    @Column(nullable = false)
    private Integer absentDaysInPeriod = 0;     // ABSENT — genuine no-show, no leave approval

    @Builder.Default
    @Column(nullable = false)
    private Integer onLeaveDaysInPeriod = 0;    // ON_LEAVE — approved leave (paid or unpaid)

    @Builder.Default
    @Column(nullable = false)
    private Integer halfDayDaysInPeriod = 0;    // HALF_DAY_MORNING + HALF_DAY_AFTERNOON combined

    /* Ratings */
    @Column(precision = 4, scale = 2)
    private BigDecimal selfRating;

    @Column(precision = 4, scale = 2)
    private BigDecimal managerRating;

    /* Comments */
    @Column(columnDefinition = "TEXT")
    private String selfComments;

    @Column(columnDefinition = "TEXT")
    private String managerComments;

    @Column(columnDefinition = "TEXT")
    private String hrComments;

    @Column(precision = 4, scale = 2)
    private BigDecimal finalScore;
}