package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.TaskPriority;
import com.ucocs.worksphere.enums.TaskStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task extends BaseEntity {

    @Column(nullable = false, unique = true)
    private String taskCode; // e.g., "TSK-104"

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    // --- Relationships ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    // The person doing the work
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_to", nullable = false)
    private Employee assignedTo;

    // FIX: Renamed from 'createdBy' to 'assigner' to avoid BaseEntity conflict
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigner_id", nullable = false)
    private Employee assigner;

    // --- Workflow & State ---

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskPriority priority = TaskPriority.MEDIUM;

    private boolean requiresEvidence = true;

    // --- Scoring & Metrics ---

    private LocalDateTime startDate;
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;

    private boolean isOverdue = false;

    // Rating: 1 to 5 stars
    private Integer managerRating;

    // Calculated score (0-100)
    private Double completionScore;

    @Column(nullable = false)
    private boolean isFlagged = false; // Set by Auditor if compliance fails

    @Column(columnDefinition = "TEXT")
    private String flagReason;         // Why was it flagged?

    @Column(nullable = false)
    private boolean isSystemOverridden = false;

    // --- Optimistic Locking ---
    @Version
    private Long version;

    // --- Getters & Setters ---

    public String getTaskCode() { return taskCode; }
    public void setTaskCode(String taskCode) { this.taskCode = taskCode; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public Employee getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Employee assignedTo) { this.assignedTo = assignedTo; }

    public Employee getAssigner() { return assigner; }
    public void setAssigner(Employee assigner) { this.assigner = assigner; }

    public TaskStatus getStatus() { return status; }
    public void setStatus(TaskStatus status) { this.status = status; }

    public TaskPriority getPriority() { return priority; }
    public void setPriority(TaskPriority priority) { this.priority = priority; }

    public boolean isRequiresEvidence() { return requiresEvidence; }
    public void setRequiresEvidence(boolean requiresEvidence) { this.requiresEvidence = requiresEvidence; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getDueDate() { return dueDate; }
    public void setDueDate(LocalDateTime dueDate) { this.dueDate = dueDate; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public boolean isOverdue() { return isOverdue; }
    public void setOverdue(boolean overdue) { isOverdue = overdue; }

    public Integer getManagerRating() { return managerRating; }
    public void setManagerRating(Integer managerRating) { this.managerRating = managerRating; }

    public Double getCompletionScore() { return completionScore; }
    public void setCompletionScore(Double completionScore) { this.completionScore = completionScore; }

    public boolean isFlagged() {
        return isFlagged;
    }

    public void setFlagged(boolean flagged) {
        isFlagged = flagged;
    }

    public String getFlagReason() {
        return flagReason;
    }

    public void setFlagReason(String flagReason) {
        this.flagReason = flagReason;
    }

    public boolean isSystemOverridden() {
        return isSystemOverridden;
    }

    public void setSystemOverridden(boolean systemOverridden) {
        isSystemOverridden = systemOverridden;
    }

    public Long getVersion() { return version; }
}

