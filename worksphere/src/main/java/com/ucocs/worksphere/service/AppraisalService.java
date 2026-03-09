package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hr.AppraisalCreateRequest;
import com.ucocs.worksphere.dto.hr.AppraisalResponse;
import com.ucocs.worksphere.dto.hr.AppraisalUpdateRatingRequest;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.PerformanceAppraisal;
import com.ucocs.worksphere.enums.AppraisalStatus;
import com.ucocs.worksphere.enums.AuditAction;
import com.ucocs.worksphere.enums.NotificationType;
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
                                .orElseThrow(() -> new RuntimeException(
                                                "Employee not found: " + request.getEmployeeId()));

                LocalDateTime startDt = request.getReviewPeriodStart().atStartOfDay();
                LocalDateTime endDt = request.getReviewPeriodEnd().atTime(23, 59, 59);

                Integer completedTasks = taskRepository.countCompletedTasksInPeriod(employee.getId(), startDt, endDt);
                Integer overdueTasks = taskRepository.countOverdueTasksInPeriod(employee.getId(), startDt, endDt);
                Double averageScore = taskRepository.getAverageTaskScoreInPeriod(employee.getId(), startDt, endDt);

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
                                .orElseThrow(() -> new RuntimeException("Appraisal not found: " + appraisalId));

                if (!appraisal.getEmployee().getId().equals(employee.getId())) {
                        throw new RuntimeException("Cannot submit self-appraisal for another employee");
                }

                if (appraisal.getStatus() != AppraisalStatus.PENDING) {
                        throw new RuntimeException(
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
                                .orElseThrow(() -> new RuntimeException("Appraisal not found: " + appraisalId));

                if (appraisal.getManager() == null || !appraisal.getManager().getId().equals(manager.getId())) {
                        // Alternatively, allow HR/Admin to perform this action. Keeping it strictly
                        // manager for now.
                        throw new RuntimeException("Only the assigned manager can submit the manager appraisal");
                }

                if (appraisal.getStatus() != AppraisalStatus.IN_REVIEW) {
                        throw new RuntimeException("Pre-requisite: Employee must submit self-appraisal first");
                }

                appraisal.setManagerRating(BigDecimal.valueOf(request.getRating()));
                appraisal.setManagerComments(request.getComments());
                appraisal.setStatus(AppraisalStatus.REVIEWED);

                // Simple average for final score. Can be weighted based on company policy.
                BigDecimal selfR = appraisal.getSelfRating() != null ? appraisal.getSelfRating()
                                : BigDecimal.valueOf(request.getRating());
                BigDecimal managerR = BigDecimal.valueOf(request.getRating());
                BigDecimal finalScore = selfR.add(managerR).divide(BigDecimal.valueOf(2), 2, RoundingMode.HALF_UP);
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
                                .orElseThrow(() -> new RuntimeException("Appraisal not found: " + appraisalId));

                if (!appraisal.getEmployee().getId().equals(employee.getId())) {
                        throw new RuntimeException(
                                        "Context mismatch: Only the employee can acknowledge their own appraisal");
                }

                if (appraisal.getStatus() != AppraisalStatus.REVIEWED) {
                        throw new RuntimeException("Pre-requisite: Appraisal must be reviewed by manager first");
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
                                .orElseThrow(() -> new RuntimeException("Employee not found: " + username));
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
                                .selfRating(appraisal.getSelfRating())
                                .managerRating(appraisal.getManagerRating())
                                .selfComments(appraisal.getSelfComments())
                                .managerComments(appraisal.getManagerComments())
                                .hrComments(appraisal.getHrComments())
                                .finalScore(appraisal.getFinalScore())
                                .build();
        }
}
