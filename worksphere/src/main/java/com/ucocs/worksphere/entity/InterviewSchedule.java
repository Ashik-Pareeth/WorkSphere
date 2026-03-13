package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.InterviewMode;
import com.ucocs.worksphere.enums.InterviewStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "interview_schedules")
@Getter
@Setter
public class InterviewSchedule extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "candidate_id", nullable = false)
    private Candidate candidate;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "interviewer_id", nullable = false)
    private Employee interviewer;

    @Column(nullable = false)
    private Integer roundNumber;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewMode mode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private InterviewStatus status = InterviewStatus.SCHEDULED;

    // Score from 1-5
    private Integer score;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    private LocalDateTime completedAt;
}
