package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.Attendance;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AttendanceDTO(
        UUID id,
        LocalDate date,
        LocalDateTime clockIn,
        LocalDateTime clockOut,
        String dailyStatus,
        Integer totalWorkMinutes,
        Boolean isManuallyAdjusted
) {
    public static AttendanceDTO fromEntity(Attendance attendance) {
        return new AttendanceDTO(
                attendance.getId(),
                attendance.getDate(),
                attendance.getClockIn(),
                attendance.getClockOut(),
                attendance.getDailyStatus() != null ? attendance.getDailyStatus().name() : null,
                attendance.getTotalWorkMinutes(),
                attendance.getIsManuallyAdjusted()
        );
    }
}