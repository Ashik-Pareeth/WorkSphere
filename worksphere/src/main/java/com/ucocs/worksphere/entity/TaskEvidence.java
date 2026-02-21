package com.ucocs.worksphere.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.ucocs.worksphere.enums.EvidenceStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "task_evidence")
public class TaskEvidence extends BaseEntity {

    // --- Getters and Setters ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    @JsonIgnore
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    @JsonIgnore
    private Employee uploadedBy;

    @Column(nullable = false)
    private String fileName; // <--- ADD THIS (Original name: "report.pdf")

    @Column(nullable = false)
    private String fileUrl;  // Path on disk: "uploads/evidence/123_report.pdf"

    @Column(nullable = false)
    private String fileType; // MIME type: "application/pdf"

    @Enumerated(EnumType.STRING)
    private EvidenceStatus status = EvidenceStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by_id")
    @JsonIgnore
    private Employee reviewedBy;

    private String reviewFeedback; // Why it was rejected or accepted

    private LocalDateTime reviewedAt;

}