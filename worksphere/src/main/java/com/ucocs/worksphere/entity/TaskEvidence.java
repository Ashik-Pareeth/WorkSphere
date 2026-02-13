package com.ucocs.worksphere.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "task_evidence")
public class TaskEvidence extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private Employee uploadedBy;

    @Column(nullable = false)
    private String fileUrl; // Path to file on disk

    @Column(nullable = false)
    private String fileType; // PDF, JPG, etc.

    // --- Getters and Setters ---
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }

    public Employee getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(Employee uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getFileUrl() { return fileUrl; }
    public void setFileUrl(String fileUrl) { this.fileUrl = fileUrl; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
}