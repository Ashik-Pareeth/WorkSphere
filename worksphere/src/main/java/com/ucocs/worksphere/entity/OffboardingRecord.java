package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.OffboardingReason;
import com.ucocs.worksphere.enums.OffboardingStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "offboarding_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EqualsAndHashCode(callSuper = true)
public class OffboardingRecord extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false, unique = true)
    private Employee employee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OffboardingReason reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OffboardingStatus status;

    @Column(nullable = false)
    private LocalDate lastWorkingDay;

    @Column(nullable = false)
    private LocalDateTime initiatedAt;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Builder.Default
    @Column(name = "it_clearance", nullable = false)
    private Boolean itClearance = false;

    @Builder.Default
    @Column(name = "hr_clearance", nullable = false)
    private Boolean hrClearance = false;

    @Builder.Default
    @Column(name = "finance_clearance", nullable = false)
    private Boolean financeClearance = false;
}
