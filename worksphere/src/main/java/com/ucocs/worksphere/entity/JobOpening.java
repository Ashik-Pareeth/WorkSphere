package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.JobOpeningStatus;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "job_openings")
@Getter
@Setter
public class JobOpening extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_position_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private JobPosition jobPosition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private JobOpeningStatus status = JobOpeningStatus.DRAFT;

    @Column(nullable = false)
    private Integer openSlots = 1;

    private LocalDate closingDate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hr_owner_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Employee hrOwner;

    // Overridable min salary (defaults to JobPosition band eventually)
    private BigDecimal salaryMin;

    // Overridable max salary (defaults to JobPosition band eventually)
    private BigDecimal salaryMax;
}
