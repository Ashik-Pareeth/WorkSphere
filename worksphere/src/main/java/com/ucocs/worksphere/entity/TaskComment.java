package com.ucocs.worksphere.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "task_comments")
public class TaskComment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private Employee author;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    // --- Getters and Setters ---
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public Employee getAuthor() { return author; }
    public void setAuthor(Employee author) { this.author = author; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}