package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.TaskPriority;
import com.ucocs.worksphere.enums.TaskStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "tasks")
// Lombok creates the empty constructor required by Hibernate, but keeps it hidden from developers
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Task extends BaseEntity {

    @Column(nullable = false, unique = true, updatable = false)
    private String taskCode;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigned_to", nullable = false)
    private Employee assignedTo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "assigner_id", nullable = false, updatable = false)
    private Employee assigner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus status = TaskStatus.TODO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskPriority priority = TaskPriority.MEDIUM;

    private boolean requiresEvidence = true;
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
    private LocalDateTime completedAt;
    private boolean isOverdue = false;
    private Integer managerRating;
    private Double completionScore;

    @Column(nullable = false)
    private boolean isFlagged = false;

    @Column(columnDefinition = "TEXT")
    private String flagReason;

    @Column(nullable = false)
    private boolean isSystemOverridden = false;

    @Version
    private Long version;

    // ------------------------------------------------------------------------
    // 1. REQUIRED CONSTRUCTOR
    // ------------------------------------------------------------------------
    public Task(String taskCode, String title, String description, Employee assigner, Employee assignedTo, LocalDateTime dueDate, TaskPriority priority) {
        this.taskCode = taskCode;
        this.title = title;
        this.description = description;
        this.assigner = assigner;
        this.assignedTo = assignedTo;
        this.dueDate = dueDate;
        this.priority = priority != null ? priority : TaskPriority.MEDIUM;
        this.status = TaskStatus.TODO;
    }

    // ------------------------------------------------------------------------
    // 2. STATE TRANSITION METHODS (The "Bank Account" Logic)
    // ------------------------------------------------------------------------

    public void updateDetails(String title, String description, TaskPriority priority, LocalDateTime dueDate) {
        if (this.status == TaskStatus.COMPLETED || this.status == TaskStatus.CANCELLED) {
            throw new IllegalStateException("Cannot edit details of a completed or cancelled task.");
        }
        this.title = title;
        this.description = description;
        this.priority = priority;
        this.dueDate = dueDate;
    }

    public void reassignTo(Employee newAssignee) {
        if (newAssignee == null) throw new IllegalArgumentException("Assignee cannot be null.");
        this.assignedTo = newAssignee;
    }

    public void startProgress() {
        if (this.status == TaskStatus.COMPLETED || this.status == TaskStatus.CANCELLED) {
            throw new IllegalStateException("Cannot start a completed or cancelled task.");
        }
        this.status = TaskStatus.IN_PROGRESS;

        // Only set the start date the very first time they begin working
        if (this.startDate == null) {
            this.startDate = LocalDateTime.now();
        }
    }

    public void submitForReview() {
        if (this.status != TaskStatus.IN_PROGRESS) {
            throw new IllegalStateException("Task must be IN_PROGRESS to submit for review.");
        }
        this.status = TaskStatus.IN_REVIEW;
    }

    public void kickBackToInProgress() {
        if (this.status != TaskStatus.IN_REVIEW) {
            throw new IllegalStateException("Can only kick back tasks that are currently IN_REVIEW.");
        }
        this.status = TaskStatus.IN_PROGRESS;
    }

    public void markAsCompleted() {
        if (this.status == TaskStatus.COMPLETED || this.status == TaskStatus.CANCELLED) {
            throw new IllegalStateException("Task is already completed or cancelled.");
        }
        this.status = TaskStatus.COMPLETED;
        this.completedAt = LocalDateTime.now();

        if (this.dueDate != null) {
            this.isOverdue = this.completedAt.isAfter(this.dueDate);
        }
    }

    public void rateTask(Integer rating, Double score) {
        if (this.status != TaskStatus.COMPLETED) {
            throw new IllegalStateException("Task must be COMPLETED before it can be rated.");
        }
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }
        this.managerRating = rating;
        this.completionScore = score;
    }

    public void cancelTask() {
        this.status = TaskStatus.CANCELLED;
    }

    // ------------------------------------------------------------------------
    // 3. AUDIT & TOGGLE METHODS
    // ------------------------------------------------------------------------

    public void setRequiresEvidence(boolean requiresEvidence) {
        this.requiresEvidence = requiresEvidence;
    }

    public void flagForAudit(String reason) {
        if (reason == null || reason.isBlank()) {
            throw new IllegalArgumentException("A reason must be provided when flagging a task.");
        }
        this.isFlagged = true;
        this.flagReason = reason;
    }

    public void resolveFlag() {
        this.isFlagged = false;
        this.flagReason = null;
    }

    public void overrideSystem() {
        this.isSystemOverridden = true;
    }
}