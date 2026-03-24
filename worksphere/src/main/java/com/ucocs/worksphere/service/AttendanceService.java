package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.AttendanceDTO;
import com.ucocs.worksphere.dto.ManualTimeUpdateRequest;
import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.TimesheetAuditLog;
import com.ucocs.worksphere.entity.WorkSchedule;
import com.ucocs.worksphere.enums.DailyStatus;
import com.ucocs.worksphere.enums.NotificationType;
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
    private final NotificationService notificationService; // ADDED

    private Employee getEmployeeByUsername(String username) {
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with username: " + username));
    }

    @Transactional
    public void clockIn(String username) {
        Employee employee = getEmployeeByUsername(username);
        LocalDate today = LocalDate.now();

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
        newAttendance.setWorkSchedule(schedule);
        newAttendance.setIsManuallyAdjusted(false);

        LocalTime currentTime = now.toLocalTime();
        long minutesLate = Duration.between(schedule.getExpectedStart(), currentTime).toMinutes();

        if (minutesLate < -720) {
            minutesLate += 1440;
        } else if (minutesLate > 720) {
            minutesLate -= 1440;
        }

        if (minutesLate > schedule.getGracePeriodMin()) {
            newAttendance.setDailyStatus(DailyStatus.LATE);

            // NOTIFICATION: Notify the employee that they clocked in late
            notificationService.send(
                    employee.getId(),
                    NotificationType.ATTENDANCE_LATE,
                    "Late Clock-In Recorded",
                    "You clocked in at " + now.toLocalTime().withSecond(0).withNano(0) + " today, which is " + minutesLate + " minute(s) past your scheduled start time of " + schedule.getExpectedStart() + ". This has been recorded.",
                    null,
                    "Attendance"
            );

            // NOTIFICATION: Also alert manager if employee is significantly late (>30 min)
            if (minutesLate > 30 && employee.getManager() != null) {
                notificationService.send(
                        employee.getManager().getId(),
                        NotificationType.ATTENDANCE_LATE,
                        employee.getFirstName() + " " + employee.getLastName() + " clocked in late",
                        employee.getFirstName() + " " + employee.getLastName() + " clocked in " + minutesLate + " minute(s) late today (" + now.toLocalTime().withSecond(0).withNano(0) + " vs scheduled " + schedule.getExpectedStart() + ").",
                        null,
                        "Attendance"
                );
            }
        } else {
            newAttendance.setDailyStatus(DailyStatus.PRESENT);
        }

        attendanceRepository.save(newAttendance);
    }

    @Transactional
    public void clockOut(String username) {
        Employee employee = getEmployeeByUsername(username);

        List<Attendance> openSessions = attendanceRepository.findOpenSessionsForEmployee(employee);
        if (openSessions.isEmpty()) {
            throw new IllegalStateException("You cannot clock out because you haven't clocked in.");
        }

        Attendance attendance = openSessions.get(0);

        if (attendance.getClockOut() != null) {
            throw new IllegalStateException("You have already clocked out.");
        }

        // --- ADDED FIX: Null safety check for clock-in ---
        if (attendance.getClockIn() == null) {
            throw new IllegalStateException("Cannot process clock-out: Clock-in time is missing for this session. Please contact HR or your manager to manually adjust your timesheet.");
        }
        // -------------------------------------------------

        LocalDateTime now = LocalDateTime.now();
        attendance.setClockOut(now);

        WorkSchedule schedule = attendance.getWorkSchedule();
        long totalMinutes = Duration.between(attendance.getClockIn(), now).toMinutes();

        int breakMin = 0;
        if (schedule != null && schedule.getBreakDurationMin() != null && totalMinutes >= 240) {
            breakMin = schedule.getBreakDurationMin();
        }

        attendance.setTotalWorkMinutes(Math.max(0, (int) (totalMinutes - breakMin)));
        attendanceRepository.save(attendance);
    }
    @Transactional(readOnly = true)
    public List<AttendanceDTO> getEmployeeAttendanceHistory(String username) {
        Employee employee = getEmployeeByUsername(username);
        return attendanceRepository.findByEmployee(employee)
                .stream()
                .map(AttendanceDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceDTO> getAttendanceHistoryForEmployee(UUID employeeId) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found with id: " + employeeId));
        return attendanceRepository.findByEmployee(employee)
                .stream()
                .map(AttendanceDTO::fromEntity)
                .toList();
    }

    @Transactional
    public Attendance manuallyUpdateTimesheet(UUID attendanceId, String managerUsername,
                                              ManualTimeUpdateRequest request) {
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new IllegalArgumentException("A valid reason must be provided for manual timesheet adjustments.");
        }

        Attendance attendance = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance record not found"));

        Employee modifyingUser = getEmployeeByUsername(managerUsername);
        Employee targetEmployee = attendance.getEmployee();

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
                throw new AccessDeniedException(
                        "Access Denied: Managers can only modify timesheets for employees within their own department.");
            }
        }

        if (request.getNewClockIn() != null && !request.getNewClockIn().equals(attendance.getClockIn())) {
            createAuditLog(attendance, modifyingUser, "clockIn",
                    String.valueOf(attendance.getClockIn()), String.valueOf(request.getNewClockIn()),
                    request.getReason());
            attendance.setClockIn(request.getNewClockIn());
        }

        if (request.getNewClockOut() != null && !request.getNewClockOut().equals(attendance.getClockOut())) {
            createAuditLog(attendance, modifyingUser, "clockOut",
                    String.valueOf(attendance.getClockOut()), String.valueOf(request.getNewClockOut()),
                    request.getReason());
            attendance.setClockOut(request.getNewClockOut());
        }

        attendance.setIsManuallyAdjusted(true);
        if (attendance.getClockIn() != null && attendance.getClockOut() != null) {
            long totalMinutes = Duration.between(attendance.getClockIn(), attendance.getClockOut()).toMinutes();
            int breakMin = 0;
            if (attendance.getWorkSchedule() != null && attendance.getWorkSchedule().getBreakDurationMin() != null && totalMinutes >= 240) {
                breakMin = attendance.getWorkSchedule().getBreakDurationMin();
            }
            attendance.setTotalWorkMinutes(Math.max(0, (int) (totalMinutes - breakMin)));
        }

        Attendance saved = attendanceRepository.save(attendance);

        // NOTIFICATION: Notify the employee that their timesheet was adjusted
        notificationService.send(
                targetEmployee.getId(),
                NotificationType.TIMESHEET_MANUALLY_ADJUSTED,
                "Your timesheet was manually adjusted",
                modifyingUser.getFirstName() + " " + modifyingUser.getLastName() + " adjusted your timesheet for " + attendance.getDate() + ". Reason: " + request.getReason() + ".",
                saved.getId(),
                "Attendance"
        );

        return saved;
    }

    private void createAuditLog(Attendance attendance, Employee manager, String field, String oldVal, String newVal,
                                String reason) {
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

    @Transactional(readOnly = true)
    public List<com.ucocs.worksphere.dto.DailyRosterDTO> getDailyRoster(String username) {
        Employee reviewer = getEmployeeByUsername(username);

        boolean isGodMode = reviewer.getRoles().stream()
                .anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN"));

        List<Attendance> todayRecords;
        LocalDate today = LocalDate.now();

        if (isGodMode) {
            todayRecords = attendanceRepository.findByDate(today);
        } else {
            if (reviewer.getDepartment() == null) {
                throw new org.springframework.security.access.AccessDeniedException(
                        "Cannot determine your department for roster access.");
            }
            todayRecords = attendanceRepository.findByDateAndEmployee_Department_Id(
                    today, reviewer.getDepartment().getId());
        }

        return todayRecords.stream().map(att -> {
            Employee emp = att.getEmployee();
            return new com.ucocs.worksphere.dto.DailyRosterDTO(
                    emp.getId(),
                    emp.getFirstName(),
                    emp.getLastName(),
                    emp.getJobPosition() != null ? emp.getJobPosition().getPositionName() : "Employee",
                    att.getDailyStatus().name(),
                    att.getClockIn(),
                    att.getClockOut(),
                    att.getId(),
                    att.getIsManuallyAdjusted());
        }).toList();
    }
}