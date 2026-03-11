package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.AttendanceDTO;
import com.ucocs.worksphere.dto.ManualTimeUpdateRequest;
import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.TimesheetAuditLog;
import com.ucocs.worksphere.dto.TimesheetAuditLogDTO;
import com.ucocs.worksphere.service.AttendanceService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@CrossOrigin("http://localhost:5173")
@RequestMapping("/attendance")
@RestController
public class AttendanceController {
    public final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    @PostMapping("/clock-in")
    @PreAuthorize("isAuthenticated()")
    public void clockInController(Principal principal) {

        attendanceService.clockIn(principal.getName());
    }

    @PostMapping("/clock-out")
    @PreAuthorize("isAuthenticated()")
    public void clockOutController(Principal principal) {

        attendanceService.clockOut(principal.getName());
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<AttendanceDTO> viewAttendanceLogOfEmployee(Principal principal) {
        return attendanceService.getEmployeeAttendanceHistory(principal.getName());
    }

    @PutMapping("/{attendanceId}/manual-update")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<AttendanceDTO> manuallyUpdateTimesheet(
            @PathVariable UUID attendanceId,
            @RequestBody ManualTimeUpdateRequest request,
            Authentication authentication) {

        String managerUsername = authentication.getName();
        Attendance updatedAttendance = attendanceService.manuallyUpdateTimesheet(attendanceId, managerUsername,
                request);
        return ResponseEntity.ok(AttendanceDTO.fromEntity(updatedAttendance));
    }

    @GetMapping("/{attendanceId}/audit-logs")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<TimesheetAuditLogDTO>> getTimesheetAuditLogs(@PathVariable UUID attendanceId) {
        List<TimesheetAuditLog> logs = attendanceService.getAuditLogsForAttendance(attendanceId);
        List<TimesheetAuditLogDTO> dtos = logs.stream()
                .map(TimesheetAuditLogDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/roster/today")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<com.ucocs.worksphere.dto.DailyRosterDTO>> getDailyRoster(Principal principal) {
        return ResponseEntity.ok(attendanceService.getDailyRoster(principal.getName()));
    }
}

