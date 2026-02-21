package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.ProjectStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Setter
@Getter
@Entity
@Table(name = "projects")
public class Project extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String projectCode; // e.g., "WEB-2026-001"

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manager_id")
    private Employee projectManager;

    @Enumerated(EnumType.STRING)
    private ProjectStatus status = ProjectStatus.PLANNING;

    private LocalDate startDate;
    private LocalDate endDate;
    private Double budget;

}