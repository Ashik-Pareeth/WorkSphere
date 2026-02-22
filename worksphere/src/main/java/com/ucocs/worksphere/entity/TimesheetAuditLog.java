package com.ucocs.worksphere.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Setter
@Getter
@Entity
@Table(name = "timesheet_audit_logs")
public class TimesheetAuditLog extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attendance_id", nullable = false)
    private Attendance attendance;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by", nullable = false)
    private Employee changedBy; // The Manager or HR Admin making the edit

    @Column(nullable = false, updatable = false)
    private Instant changeTimestamp = Instant.now();

    @Column(nullable = false, length = 50)
    private String fieldChanged; // e.g., "clockIn" or "clockOut"

    @Column(length = 255)
    private String oldValue;

    @Column(nullable = false, length = 255)
    private String newValue;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason; // Mandatory justification
}