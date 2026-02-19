package com.ucocs.worksphere.entity;

import com.ucocs.worksphere.enums.TaskStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_history")
public class TaskHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by_id", nullable = false)
    private Employee changedBy;

    // Snapshot of the specific role used (e.g., "ROLE_SENIOR_MANAGER")
    @Column(nullable = false)
    private String actorRoleName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TaskStatus newStatus;

    @Column(columnDefinition = "TEXT")
    private String comment; // Rejection reason, completion note, or auto-generated log

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // Constructors
    public TaskHistory() {}

    public TaskHistory(Task task, Employee changedBy, String actorRoleName,
                       TaskStatus oldStatus, TaskStatus newStatus, String comment) {
        this.task = task;
        this.changedBy = changedBy;
        this.actorRoleName = actorRoleName;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.comment = comment;
        this.timestamp = LocalDateTime.now();
    }

    // Getters
    public Long getId() { return id; }
    public Task getTask() { return task; }
    public Employee getChangedBy() { return changedBy; }
    public String getActorRoleName() { return actorRoleName; }
    public TaskStatus getOldStatus() { return oldStatus; }
    public TaskStatus getNewStatus() { return newStatus; }
    public String getComment() { return comment; }
    public LocalDateTime getTimestamp() { return timestamp; }
}