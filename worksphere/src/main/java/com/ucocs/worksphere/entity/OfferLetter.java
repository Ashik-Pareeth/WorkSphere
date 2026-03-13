package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.OfferStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "offer_letters")
@Getter
@Setter
public class OfferLetter extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_opening_id", nullable = false)
    private JobOpening jobOpening;

    @Column(nullable = false)
    private BigDecimal proposedSalary;

    @Column(nullable = false)
    private LocalDate joiningDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OfferStatus status = OfferStatus.DRAFT;

    private LocalDateTime sentAt;

    private LocalDateTime respondedAt;

    private LocalDate expiresAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "generated_by_employee_id", nullable = false)
    private Employee generatedBy;

    @Column(columnDefinition = "TEXT")
    private String salaryStructureSnapshot;
}
