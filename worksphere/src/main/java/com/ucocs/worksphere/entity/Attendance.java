package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.DailyStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Setter
@Getter
@Entity
@Table(name = "attendance")
public class Attendance extends BaseEntity {

    // id (UUID) is inherited from BaseEntity

    @Column(nullable = false)
    private LocalDate date;

    @Column(nullable = true)
    private LocalDateTime clockIn;

    @Column(nullable = true)
    private LocalDateTime clockOut;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "schedule_id", nullable = false)
    private WorkSchedule workSchedule; // Snapshot at time of record

    @Column(nullable = true)
    private Integer totalWorkMinutes; // Computed: (clockOut - clockIn) − breakDurationMin

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DailyStatus dailyStatus;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean isManuallyAdjusted = false;
}