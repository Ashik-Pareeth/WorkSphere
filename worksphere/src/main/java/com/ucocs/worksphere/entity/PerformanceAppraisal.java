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
