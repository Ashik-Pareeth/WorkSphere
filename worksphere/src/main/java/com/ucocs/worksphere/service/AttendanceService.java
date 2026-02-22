package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.AttendanceDTO;
import com.ucocs.worksphere.dto.ManualTimeUpdateRequest;
import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.TimesheetAuditLog;
import com.ucocs.worksphere.entity.WorkSchedule;
import com.ucocs.worksphere.enums.DailyStatus;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.AttendanceRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.TimesheetAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EmployeeRepository employeeRepository;
    private final TimesheetAuditLogRepository auditLogRepository;

    // --- HELPER METHOD TO KEEP CODE DRY ---
    private Employee getEmployeeByUsername(String username) {
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with username: " + username));
    }

    // --- YOUR UPDATED CLOCK-IN LOGIC ---
    @Transactional
    public void clockIn(String username) {
        Employee employee = getEmployeeByUsername(username);
        LocalDate today = LocalDate.now();

        // Assuming your AttendanceRepository has been updated to use existsBy...
        Attendance existingAttendance = attendanceRepository.findByEmployeeAndDate(employee, today);

        if (existingAttendance != null) {
            throw new IllegalStateException("You are already clocked in for today.");
        }

        WorkSchedule schedule = employee.getWorkSchedule();
        if (schedule == null) {
            throw new IllegalStateException("No work schedule assigned to employee. Cannot clock in.");
        }

        Attendance newAttendance = new Attendance();
        newAttendance.setEmployee(employee);
        newAttendance.setDate(today);

        LocalDateTime now = LocalDateTime.now();
        newAttendance.setClockIn(now);

        // 1. Snapshot the schedule
        newAttendance.setWorkSchedule(schedule);
        newAttendance.setIsManuallyAdjusted(false);

        // 2. Late Detection Logic
        LocalTime currentTime = now.toLocalTime();
        long minutesLate = Duration.between(schedule.getExpectedStart(), currentTime).toMinutes();

        if (minutesLate > schedule.getGracePeriodMin()) {
            newAttendance.setDailyStatus(DailyStatus.LATE);
        } else {
            newAttendance.setDailyStatus(DailyStatus.PRESENT);
        }

        attendanceRepository.save(newAttendance);
    }

    // --- YOUR UPDATED CLOCK-OUT LOGIC ---
    @Transactional
    public void clockOut(String username) {
        Employee employee = getEmployeeByUsername(username);
        LocalDate today = LocalDate.now();

        Attendance attendance = attendanceRepository.findByEmployeeAndDate(employee, today);

        if (attendance == null) {
            throw new IllegalStateException("You cannot clock out because you haven't clocked in today.");
        }

        if (attendance.getClockOut() != null) {
            throw new IllegalStateException("You have already clocked out for today.");
        }

        LocalDateTime now = LocalDateTime.now();
        attendance.setClockOut(now);

        // 3. Work Calculation with Break Deduction
        WorkSchedule schedule = attendance.getWorkSchedule();
        long totalMinutes = Duration.between(attendance.getClockIn(), now).toMinutes();
        int finalWorkMinutes = (int) (totalMinutes - schedule.getBreakDurationMin());

        // Ensure we don't save negative minutes if someone clocks out immediately
        attendance.setTotalWorkMinutes(Math.max(0, finalWorkMinutes));

        attendanceRepository.save(attendance);
    }

    // --- YOUR EXISTING HISTORY LOGIC ---
    @Transactional(readOnly = true)
    public List<AttendanceDTO> getEmployeeAttendanceHistory(String username) {
        Employee employee = getEmployeeByUsername(username);

        // Note: You may need to update AttendanceDTO.fromEntity to handle the UUID change
        return attendanceRepository.findByEmployee(employee)
                .stream()
                .map(AttendanceDTO::fromEntity)
                .toList();
    }

    // --- THE NEW MANUAL OVERRIDE LOGIC ---
    @Transactional
    public Attendance manuallyUpdateTimesheet(UUID attendanceId, UUID managerId, ManualTimeUpdateRequest request) {
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("A valid reason must be provided for manual timesheet adjustments.");
        }

        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));

        Employee modifyingUser = employeeRepository.findById(managerId)
                .orElseThrow(() -> new ResourceNotFoundException("Modifying user not found"));

        Employee targetEmployee = attendance.getEmployee();

        // 4. Row-Level Security Authorization
        boolean hasGodMode = modifyingUser.getRoles().stream()
                .anyMatch(role -> {
                    String roleName = role.getRoleName().toUpperCase();
                    return roleName.endsWith("ADMIN") || roleName.endsWith("HR");
                });

        if (!hasGodMode) {
            if (modifyingUser.getDepartment() == null || targetEmployee.getDepartment() == null) {
                throw new AccessDeniedException("Department assignment missing. Cannot verify manager jurisdiction.");
            }
            if (!modifyingUser.getDepartment().getId().equals(targetEmployee.getDepartment().getId())) {
                throw new AccessDeniedException("Access Denied: Managers can only modify timesheets for employees within their own department.");
            }
        }

        // Audit Clock In Change
        if (request.getNewClockIn() != null && !request.getNewClockIn().equals(attendance.getClockIn())) {
            createAuditLog(attendance, modifyingUser, "clockIn",
                    String.valueOf(attendance.getClockIn()), String.valueOf(request.getNewClockIn()), request.getReason());
            attendance.setClockIn(request.getNewClockIn());
        }

        // Audit Clock Out Change
        if (request.getNewClockOut() != null && !request.getNewClockOut().equals(attendance.getClockOut())) {
            createAuditLog(attendance, modifyingUser, "clockOut",
                    String.valueOf(attendance.getClockOut()), String.valueOf(request.getNewClockOut()), request.getReason());
            attendance.setClockOut(request.getNewClockOut());
        }

        // Recalculate Work Minutes and Flag as Adjusted
        attendance.setIsManuallyAdjusted(true);
        if (attendance.getClockIn() != null && attendance.getClockOut() != null) {
            long totalMinutes = Duration.between(attendance.getClockIn(), attendance.getClockOut()).toMinutes();
            int breakMin = attendance.getWorkSchedule().getBreakDurationMin();
            attendance.setTotalWorkMinutes((int) (totalMinutes - breakMin));
        }

        return attendanceRepository.save(attendance);
    }

    private void createAuditLog(Attendance attendance, Employee manager, String field, String oldVal, String newVal, String reason) {
        TimesheetAuditLog log = new TimesheetAuditLog();
        log.setAttendance(attendance);
        log.setChangedBy(manager);
        log.setFieldChanged(field);
        log.setOldValue(oldVal);
        log.setNewValue(newVal);
        log.setReason(reason);
        auditLogRepository.save(log);
    }
    @Transactional(readOnly = true)
    public List<TimesheetAuditLog> getAuditLogsForAttendance(UUID attendanceId) {
        return auditLogRepository.findByAttendanceIdOrderByChangeTimestampDesc(attendanceId);
    }
}