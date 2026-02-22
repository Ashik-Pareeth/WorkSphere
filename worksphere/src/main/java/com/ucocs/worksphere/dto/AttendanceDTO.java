package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.Attendance;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record AttendanceDTO(
        UUID id,
        LocalDate date,
        LocalDateTime clockIn,
        LocalDateTime clockOut
) {
    public static AttendanceDTO fromEntity(Attendance attendance) {
        return new AttendanceDTO(
                attendance.getId(), // Note: If your Attendance ID is a Long, change UUID to Long here!
                attendance.getDate(),
                attendance.getClockIn(),
                attendance.getClockOut()
        );
    }
}