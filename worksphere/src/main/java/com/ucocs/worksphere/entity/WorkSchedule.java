package com.ucocs.worksphere.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Setter
@Getter
@Entity
@Table(name = "work_schedules")
public class WorkSchedule extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String scheduleName;

    @Column(nullable = false, length = 60)
    private String timezone;

    @Column(nullable = false)
    private LocalTime expectedStart;

    @Column(nullable = false)
    private LocalTime expectedEnd;

    @Column(columnDefinition = "integer default 0")
    private Integer gracePeriodMin = 0;

    @Column(nullable = false)
    private Integer breakDurationMin;

    @Column(nullable = false)
    private Integer workingDays; // Bitmask: Bit 0=Mon ... Bit 6=Sun
}