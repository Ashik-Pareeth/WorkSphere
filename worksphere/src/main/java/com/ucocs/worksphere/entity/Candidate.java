package com.ucocs.worksphere.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ucocs.worksphere.enums.CandidateSource;
import com.ucocs.worksphere.enums.CandidateStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "candidates")
@Getter
@Setter
public class Candidate extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_opening_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private JobOpening jobOpening;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false)
    private String email;

    private String phone;

    private String resumeUrl; // For storing external Google Drive/LinkedIn links

    private String resumeFileUrl; // For storing locally uploaded resume file paths

    @Column(columnDefinition = "TEXT")
    private String coverNote;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CandidateStatus status = CandidateStatus.APPLIED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private CandidateSource source = CandidateSource.PORTAL;

    private String rejectionReason;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "converted_employee_id")
    private Employee convertedEmployee;
}
