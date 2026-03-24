package com.ucocs.worksphere.scheduler;

import com.ucocs.worksphere.entity.Attendance;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.DailyStatus;
import com.ucocs.worksphere.enums.EmployeeStatus;
import com.ucocs.worksphere.enums.LeaveRequestStatus;
import com.ucocs.worksphere.repository.AttendanceRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.LeaveRequestRepository;
import com.ucocs.worksphere.service.PublicHolidayService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

/**
 * Midnight Absentee Job (Phase 3).
 * Runs at 11:59 PM every night.
 * Checks who was supposed to work today but never clocked in,
 * and generates an Attendance row with DailyStatus.ABSENT or DailyStatus.ON_LEAVE.
 */
@Component
@RequiredArgsConstructor
public class MidnightAbsenteeJob {

    private static final Logger log = LoggerFactory.getLogger(MidnightAbsenteeJob.class);

    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;
    private final PublicHolidayService publicHolidayService;
    private final LeaveRequestRepository leaveRequestRepository; // <-- ADDED THIS

    @Scheduled(cron = "0 59 23 * * *")
    @Transactional
    public void markAbsentees() {
        LocalDate today = LocalDate.now();

        // 1. Skip if today is a public holiday
        if (publicHolidayService.isHoliday(today)) {
            log.info("[AbsenteeJob] Today ({}) is a public holiday. Skipping.", today);
            return;
        }

        // 2. Get all ACTIVE employees
        List<Employee> activeEmployees = employeeRepository.findByEmployeeStatus(EmployeeStatus.ACTIVE);

        int recordCount = 0;
        for (Employee emp : activeEmployees) {
            // 3. Check if this day is a working day for the employee's schedule
            if (!isWorkingDay(emp, today)) {
                continue;
            }

            // 4. Check if an attendance record already exists for today
            Attendance existing = attendanceRepository.findByEmployeeAndDate(emp, today);
            if (existing != null) {
                continue; // They clocked in (or were already marked)
            }

            // 5. NEW LOGIC: Check if the employee is on an approved leave today
            boolean isOnLeave = leaveRequestRepository.existsByEmployee_IdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                    emp.getId(),
                    List.of(LeaveRequestStatus.APPROVED),
                    today, // endDate param
                    today  // startDate param
            );

            // 6. Generate the appropriate Attendance record
            Attendance generatedRecord = new Attendance();
            generatedRecord.setEmployee(emp);
            generatedRecord.setDate(today);

            // Assign ON_LEAVE if they have an approved request, otherwise ABSENT
            if (isOnLeave) {
                generatedRecord.setDailyStatus(DailyStatus.ON_LEAVE);
            } else {
                generatedRecord.setDailyStatus(DailyStatus.ABSENT);
            }

            generatedRecord.setClockIn(null);
            generatedRecord.setClockOut(null);
            generatedRecord.setTotalWorkMinutes(0);
            generatedRecord.setIsManuallyAdjusted(false);
            generatedRecord.setWorkSchedule(emp.getWorkSchedule());
            attendanceRepository.save(generatedRecord);
            recordCount++;
        }

        log.info("[AbsenteeJob] Completed for {}. Generated {} absent/leave records.", today, recordCount);
    }

    /**
     * Checks if the given date is a working day according to the employee's
     * WorkSchedule.
     */
    private boolean isWorkingDay(Employee emp, LocalDate date) {
        if (emp.getWorkSchedule() == null) {
            // If employee has no schedule assigned, assume Mon-Fri
            DayOfWeek dow = date.getDayOfWeek();
            return dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY;
        }

        int bitmask = emp.getWorkSchedule().getWorkingDays();
        int dayBit = date.getDayOfWeek().getValue() - 1; // Monday=0, Sunday=6
        return (bitmask & (1 << dayBit)) != 0;
    }
}