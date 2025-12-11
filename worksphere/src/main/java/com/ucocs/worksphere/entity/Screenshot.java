package com.ucocs.worksphere.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "screenshot")
public class Screenshot {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long screenshotId;
    private LocalDateTime timeStamp;
    private String filePath;
    @ManyToOne
    @JoinColumn(name = "work_session_id")
    private WorkSession workSession;

    public Long getScreenshotId() {
        return screenshotId;
    }

    public void setScreenshotId(Long screenshotId) {
        this.screenshotId = screenshotId;
    }

    public LocalDateTime getTimeStamp() {
        return timeStamp;
    }

    public void setTimeStamp(LocalDateTime timeStamp) {
        this.timeStamp = timeStamp;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public WorkSession getWorkSession() {
        return workSession;
    }

    public void setWorkSession(WorkSession workSession) {
        this.workSession = workSession;
    }
}
