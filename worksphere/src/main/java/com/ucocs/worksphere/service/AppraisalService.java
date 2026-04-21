package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hr.AppraisalCreateRequest;
import com.ucocs.worksphere.dto.hr.AppraisalResponse;
import com.ucocs.worksphere.dto.hr.AppraisalUpdateRatingRequest;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.PerformanceAppraisal;
import com.ucocs.worksphere.enums.AppraisalStatus;
import com.ucocs.worksphere.enums.AuditAction;
import com.ucocs.worksphere.enums.DailyStatus;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.AttendanceRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.PerformanceAppraisalRepository;
import com.ucocs.worksphere.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AppraisalService {

        private final PerformanceAppraisalRepository appraisalRepository;
        private final EmployeeRepository employeeRepository;
        private final TaskRepository taskRepository;
        private final AttendanceRepository attendanceRepository;
        private final AuditService auditService;
        private final NotificationService notificationService;

        /**
         * Create a new appraisal cycle for an employee. Automatically pulls metrics
         * from Tasks.
         */
        @Transactional
        public AppraisalResponse createAppraisal(AppraisalCreateRequest request, String initiatedByUsername) {
                Employee initiator = resolveEmployee(initiatedByUsername);
                Employee employee = employeeRepository.findById(request.getEmployeeId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Employee not found: " + request.getEmployeeId()));

                LocalDateTime startDt = request.getReviewPeriodStart().atStartOfDay();
                LocalDateTime endDt = request.getReviewPeriodEnd().atTime(23, 59, 59);

                // --- Task metrics (objective work-output data) ---
                Integer completedTasks = taskRepository.countCompletedTasksInPeriod(employee.getId(), startDt, endDt);
                Integer overdueTasks = taskRepository.countOverdueTasksInPeriod(employee.getId(), startDt, endDt);
                Double averageScore = taskRepository.getAverageTaskScoreInPeriod(employee.getId(), startDt, endDt);

                // --- Attendance metrics (objective punctuality/reliability data) ---
                // PRESENT days: employee arrived on time (within grace period)
                Integer presentDays = attendanceRepository.countByStatusInPeriod(
                        employee.getId(), request.getReviewPeriodStart(), request.getReviewPeriodEnd(),
                        DailyStatus.PRESENT);
                // LATE days: employee arrived but past the grace period
                Integer lateDays = attendanceRepository.countByStatusInPeriod(
                        employee.getId(), request.getReviewPeriodStart(), request.getReviewPeriodEnd(),
                        DailyStatus.LATE);
                // ABSENT days: employee never clocked in AND had no approved leave
                Integer absentDays = attendanceRepository.countByStatusInPeriod(
                        employee.getId(), request.getReviewPeriodStart(), request.getReviewPeriodEnd(),
                        DailyStatus.ABSENT);
                // ON_LEAVE days: employee had an approved leave request (set by MidnightAbsenteeJob)
                Integer onLeaveDays = attendanceRepository.countByStatusInPeriod(
                        employee.getId(), request.getReviewPeriodStart(), request.getReviewPeriodEnd(),
                        DailyStatus.ON_LEAVE);
                // HALF_DAY days: combined count of HALF_DAY_MORNING and HALF_DAY_AFTERNOON
                Integer halfDayMorning = attendanceRepository.countByStatusInPeriod(
                        employee.getId(), request.getReviewPeriodStart(), request.getReviewPeriodEnd(),
                        DailyStatus.HALF_DAY_MORNING);
                Integer halfDayAfternoon = attendanceRepository.countByStatusInPeriod(
                        employee.getId(), request.getReviewPeriodStart(), request.getReviewPeriodEnd(),
                        DailyStatus.HALF_DAY_AFTERNOON);
                int halfDays = (halfDayMorning != null ? halfDayMorning : 0)
                        + (halfDayAfternoon != null ? halfDayAfternoon : 0);

                PerformanceAppraisal appraisal = PerformanceAppraisal.builder()
                        .employee(employee)
                        .manager(employee.getManager())
                        .cycleType(request.getCycleType())
                        .status(AppraisalStatus.PENDING)
                        .reviewPeriodStart(request.getReviewPeriodStart())
                        .reviewPeriodEnd(request.getReviewPeriodEnd())
                        .tasksCompletedInPeriod(completedTasks != null ? completedTasks : 0)
                        .tasksOverdueInPeriod(overdueTasks != null ? overdueTasks : 0)
                        .averageTaskScore(BigDecimal.valueOf(averageScore != null ? averageScore : 0.0))
                        .presentDaysInPeriod(presentDays != null ? presentDays : 0)
                        .lateDaysInPeriod(lateDays != null ? lateDays : 0)
                        .absentDaysInPeriod(absentDays != null ? absentDays : 0)
                        .onLeaveDaysInPeriod(onLeaveDays != null ? onLeaveDays : 0)
                        .halfDayDaysInPeriod(halfDays)
                        .build();

                PerformanceAppraisal saved = appraisalRepository.save(appraisal);

                auditService.log("PerformanceAppraisal", saved.getId(), AuditAction.CREATED,
                        initiator.getId(), null,
                        "Created " + request.getCycleType() + " appraisal for " + employee.getUserName());

                notificationService.send(
                        employee.getId(),
                        NotificationType.APPRAISAL_DUE,
                        "Action Required: Self-Appraisal",
                        "Your " + request.getCycleType()
                                + " performance appraisal is due. Please submit your self-rating.",
                        saved.getId(),
                        "PerformanceAppraisal");

                if (employee.getManager() != null) {
                        notificationService.send(
                                employee.getManager().getId(),
                                NotificationType.APPRAISAL_DUE,
                                "Appraisal Cycle Started: " + employee.getFirstName() + " "
                                        + employee.getLastName(),
                                "An appraisal cycle has been initiated for your direct report.",
                                saved.getId(),
                                "PerformanceAppraisal");
                }

                return toResponse(saved);
        }

        /**
         * Submit Self-Appraisal (Employee action)
         */
        @Transactional
        public AppraisalResponse submitSelfAppraisal(UUID appraisalId, AppraisalUpdateRatingRequest request,
                                                     String username) {
                Employee employee = resolveEmployee(username);
                PerformanceAppraisal appraisal = appraisalRepository.findById(appraisalId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appraisal not found: " + appraisalId));

                if (!appraisal.getEmployee().getId().equals(employee.getId())) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                "Cannot submit self-appraisal for another employee");
                }

                if (appraisal.getStatus() != AppraisalStatus.PENDING) {
                        throw new IllegalStateException(
                                "Pre-requisite: Appraisal must be in PENDING status to submit self-review");
                }

                appraisal.setSelfRating(BigDecimal.valueOf(request.getRating()));
                appraisal.setSelfComments(request.getComments());
                appraisal.setStatus(AppraisalStatus.IN_REVIEW);

                PerformanceAppraisal saved = appraisalRepository.save(appraisal);

                auditService.log("PerformanceAppraisal", saved.getId(), AuditAction.UPDATED,
                        employee.getId(), "Status: PENDING", "Status: IN_REVIEW (Self-Appraisal Submitted)");

                if (appraisal.getManager() != null) {
                        notificationService.send(
                                appraisal.getManager().getId(),
                                NotificationType.APPRAISAL_RECEIVED,
                                "Self-Appraisal Submitted: " + employee.getFirstName(),
                                "Your direct report has submitted their self-appraisal. Please review and provide your manager rating.",
                                saved.getId(),
                                "PerformanceAppraisal");
                }

                return toResponse(saved);
        }

        /**
         * Submit Manager Appraisal (Manager action)
         */
        @Transactional
        public AppraisalResponse submitManagerAppraisal(UUID appraisalId, AppraisalUpdateRatingRequest request,
                                                        String username) {
                Employee manager = resolveEmployee(username);
                PerformanceAppraisal appraisal = appraisalRepository.findById(appraisalId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appraisal not found: " + appraisalId));

                boolean isHrOrAdmin = manager.getRoles().stream()
                        .anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN"));

                if (!isHrOrAdmin && (appraisal.getManager() == null
                        || !appraisal.getManager().getId().equals(manager.getId()))) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                "Only the assigned manager, HR, or Admin can submit the manager appraisal");
                }

                if (appraisal.getStatus() != AppraisalStatus.IN_REVIEW) {
                        throw new IllegalStateException("Pre-requisite: Employee must submit self-appraisal first");
                }

                appraisal.setManagerRating(BigDecimal.valueOf(request.getRating()));
                appraisal.setManagerComments(request.getComments());
                appraisal.setStatus(AppraisalStatus.REVIEWED);

                /*
                 * WEIGHTED FINAL SCORE FORMULA
                 * All inputs are normalised to a 1–5 scale before weighting.
                 *
                 * Component                 Weight  Source
                 * ─────────────────────────────────────────────────────────────────
                 * Manager rating            40 %    Subjective — direct observation
                 * Self rating               20 %    Subjective — employee self-view
                 * Task quality score        25 %    averageTaskScore (already 1–5)
                 * Attendance reliability    15 %    Derived from attendance records
                 * ─────────────────────────────────────────────────────────────────
                 * Total                    100 %
                 *
                 * Attendance reliability score (1–5):
                 *
                 *   Status treatment:
                 *     PRESENT    → full positive day  (effectivePresent += 1, scoredDays += 1)
                 *     LATE       → attended but not punctual (effectivePresent += 0, scoredDays += 1)
                 *     HALF_DAY   → partial attendance (effectivePresent += 0.5, scoredDays += 1)
                 *     ABSENT     → genuine no-show    (effectivePresent += 0, scoredDays += 1)
                 *     ON_LEAVE   → approved leave     (excluded from both — NEUTRAL, no penalty)
                 *
                 *   If scoredDays == 0 → neutral score of 3.0 (no data, no penalty)
                 *   attendanceRate  = effectivePresent / scoredDays
                 *   attendanceScore = attendanceRate × 4 + 1  → maps 0% → 1.0, 100% → 5.0
                 *
                 * Rationale: ON_LEAVE is explicitly excluded because the employee had an approved
                 * leave request — the MidnightAbsenteeJob already distinguishes ABSENT from ON_LEAVE.
                 * Treating approved leave the same as absence would penalise employees for using a
                 * legitimate entitlement, which is inconsistent with how payroll handles it
                 * (paid leave = present day for salary). Attendance is already factored into payroll
                 * via LOP deductions on ABSENT days; here it adds a reliability signal only.
                 */
                BigDecimal selfR    = appraisal.getSelfRating() != null
                        ? appraisal.getSelfRating()
                        : BigDecimal.valueOf(request.getRating());
                BigDecimal managerR = BigDecimal.valueOf(request.getRating());

                // Task quality: if no tasks were completed, treat as neutral 3.0
                BigDecimal taskScore = (appraisal.getAverageTaskScore() != null
                        && appraisal.getAverageTaskScore().compareTo(BigDecimal.ZERO) > 0)
                        ? appraisal.getAverageTaskScore()
                        : BigDecimal.valueOf(3.0);

                // Attendance reliability score
                int presentDays  = appraisal.getPresentDaysInPeriod() != null ? appraisal.getPresentDaysInPeriod() : 0;
                int lateDays     = appraisal.getLateDaysInPeriod()    != null ? appraisal.getLateDaysInPeriod()    : 0;
                int absentDays   = appraisal.getAbsentDaysInPeriod()  != null ? appraisal.getAbsentDaysInPeriod()  : 0;
                int halfDays     = appraisal.getHalfDayDaysInPeriod() != null ? appraisal.getHalfDayDaysInPeriod() : 0;
                // ON_LEAVE is intentionally excluded from scoredDays — approved leave is neutral

                int scoredDays = presentDays + lateDays + absentDays + halfDays;

                BigDecimal attendanceScore;
                if (scoredDays == 0) {
                        // No scorable attendance data for this period — assign neutral score
                        attendanceScore = BigDecimal.valueOf(3.0);
                } else {
                        // effectivePresent: PRESENT = 1.0, HALF_DAY = 0.5, LATE = 0.0, ABSENT = 0.0
                        double effectivePresent = presentDays + (halfDays * 0.5);
                        // attendanceScore = (effectivePresent / scoredDays) * 4 + 1 → range [1.0, 5.0]
                        attendanceScore = BigDecimal.valueOf(effectivePresent)
                                .divide(BigDecimal.valueOf(scoredDays), 6, RoundingMode.HALF_UP)
                                .multiply(BigDecimal.valueOf(4))
                                .add(BigDecimal.ONE)
                                .setScale(2, RoundingMode.HALF_UP);
                }

                // Weighted sum: 40% manager + 20% self + 25% task quality + 15% attendance
                BigDecimal finalScore = managerR    .multiply(BigDecimal.valueOf(0.40))
                        .add(selfR          .multiply(BigDecimal.valueOf(0.20)))
                        .add(taskScore      .multiply(BigDecimal.valueOf(0.25)))
                        .add(attendanceScore.multiply(BigDecimal.valueOf(0.15)))
                        .setScale(2, RoundingMode.HALF_UP);

                appraisal.setFinalScore(finalScore);

                PerformanceAppraisal saved = appraisalRepository.save(appraisal);

                auditService.log("PerformanceAppraisal", saved.getId(), AuditAction.UPDATED,
                        manager.getId(), "Status: IN_REVIEW", "Status: REVIEWED (Manager Appraisal Submitted)");

                notificationService.send(
                        appraisal.getEmployee().getId(),
                        NotificationType.APPRAISAL_RECEIVED,
                        "Manager Review Completed",
                        "Your manager has completed their review. Please acknowledge the appraisal.",
                        saved.getId(),
                        "PerformanceAppraisal");

                return toResponse(saved);
        }

        /**
         * Acknowledge Appraisal (Employee action)
         */
        @Transactional
        public AppraisalResponse acknowledgeAppraisal(UUID appraisalId, String username) {
                Employee employee = resolveEmployee(username);
                PerformanceAppraisal appraisal = appraisalRepository.findById(appraisalId)
                        .orElseThrow(() -> new ResourceNotFoundException("Appraisal not found: " + appraisalId));

                if (!appraisal.getEmployee().getId().equals(employee.getId())) {
                        throw new org.springframework.security.access.AccessDeniedException(
                                "Context mismatch: Only the employee can acknowledge their own appraisal");
                }

                if (appraisal.getStatus() != AppraisalStatus.REVIEWED) {
                        throw new IllegalStateException("Pre-requisite: Appraisal must be reviewed by manager first");
                }

                appraisal.setStatus(AppraisalStatus.ACKNOWLEDGED);
                PerformanceAppraisal saved = appraisalRepository.save(appraisal);

                auditService.log("PerformanceAppraisal", saved.getId(), AuditAction.UPDATED,
                        employee.getId(), "Status: REVIEWED", "Status: ACKNOWLEDGED");

                return toResponse(saved);
        }

        // Getters

        @Transactional(readOnly = true)
        public List<AppraisalResponse> getAllAppraisals() {
                return appraisalRepository.findAll().stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<AppraisalResponse> getMyAppraisals(String username) {
                Employee employee = resolveEmployee(username);
                return appraisalRepository.findByEmployeeOrderByReviewPeriodEndDesc(employee).stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());
        }

        @Transactional(readOnly = true)
        public List<AppraisalResponse> getTeamAppraisals(String username) {
                Employee manager = resolveEmployee(username);
                return appraisalRepository.findByManagerOrderByReviewPeriodEndDesc(manager).stream()
                        .map(this::toResponse)
                        .collect(Collectors.toList());
        }

        private Employee resolveEmployee(String username) {
                return employeeRepository.findByUserName(username)
                        .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + username));
        }

        private AppraisalResponse toResponse(PerformanceAppraisal appraisal) {
                return AppraisalResponse.builder()
                        .id(appraisal.getId())
                        .employeeId(appraisal.getEmployee().getId())
                        .employeeName(appraisal.getEmployee().getFirstName() + " "
                                + appraisal.getEmployee().getLastName())
                        .managerId(appraisal.getManager() != null ? appraisal.getManager().getId() : null)
                        .managerName(appraisal.getManager() != null
                                ? appraisal.getManager().getFirstName() + " "
                                + appraisal.getManager().getLastName()
                                : "Unassigned")
                        .cycleType(appraisal.getCycleType())
                        .status(appraisal.getStatus())
                        .reviewPeriodStart(appraisal.getReviewPeriodStart())
                        .reviewPeriodEnd(appraisal.getReviewPeriodEnd())
                        .tasksCompletedInPeriod(appraisal.getTasksCompletedInPeriod())
                        .tasksOverdueInPeriod(appraisal.getTasksOverdueInPeriod())
                        .averageTaskScore(appraisal.getAverageTaskScore())
                        .presentDaysInPeriod(appraisal.getPresentDaysInPeriod())
                        .lateDaysInPeriod(appraisal.getLateDaysInPeriod())
                        .absentDaysInPeriod(appraisal.getAbsentDaysInPeriod())
                        .onLeaveDaysInPeriod(appraisal.getOnLeaveDaysInPeriod())
                        .halfDayDaysInPeriod(appraisal.getHalfDayDaysInPeriod())
                        .selfRating(appraisal.getSelfRating())
                        .managerRating(appraisal.getManagerRating())
                        .selfComments(appraisal.getSelfComments())
                        .managerComments(appraisal.getManagerComments())
                        .hrComments(appraisal.getHrComments())
                        .finalScore(appraisal.getFinalScore())
                        .build();
        }
}
