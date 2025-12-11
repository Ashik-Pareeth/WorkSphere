package com.ucocs.worksphere.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "work_session")
public class WorkSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long workSession_id;
    @Column(nullable = false)
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean isActive;
    @ManyToOne
    @JoinColumn(name = "employee_id")
    private Employee employee;

    public Long getWorkSession_id() {
        return workSession_id;
    }

    public void setWorkSession_id(Long workSession_id) {
        this.workSession_id = workSession_id;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public boolean isActive() {
        return isActive;
    }

    public void setActive(boolean active) {
        isActive = active;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }
}
