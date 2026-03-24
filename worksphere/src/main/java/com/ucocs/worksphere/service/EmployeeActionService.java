package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hr.EmployeeActionRequest;
import com.ucocs.worksphere.dto.hr.EmployeeActionResponse;
import com.ucocs.worksphere.dto.hr.ManagerReportRequest;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.EmployeeActionRecord;
import com.ucocs.worksphere.enums.*;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.EmployeeActionRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.JobPositionRepository;
import com.ucocs.worksphere.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeActionService {

    private final EmployeeActionRepository actionRepo;
    private final EmployeeRepository employeeRepo;
    private final JobPositionRepository jobPositionRepo;
    private final DepartmentRepository departmentRepo;
    private final NotificationService notificationService; // ADDED

    // ── HR / SUPER_ADMIN: take a direct action ────────────────────────────────

    @Transactional
    public EmployeeActionResponse applyAction(String initiatorUsername, EmployeeActionRequest req) {
        Employee initiator = findByUsername(initiatorUsername);
        Employee target = employeeRepo.findById(req.employeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + req.employeeId()));

        EmployeeActionType type = EmployeeActionType.valueOf(req.actionType());

        EmployeeActionRecord record = new EmployeeActionRecord();
        record.setEmployee(target);
        record.setInitiatedBy(initiator);
        record.setActionType(type);
        record.setStatus(EmployeeActionStatus.COMPLETED);
        record.setReason(req.reason());
        record.setEffectiveDate(req.effectiveDate() != null ? req.effectiveDate() : LocalDate.now());
        record.setEndDate(req.endDate());

        record.setPreviousJobPosition(
                target.getJobPosition() != null ? target.getJobPosition().getPositionName() : null);
        record.setPreviousDepartment(
                target.getDepartment() != null ? target.getDepartment().getName() : null);
        record.setPreviousSalary(BigDecimal.valueOf(target.getSalary()));

        switch (type) {
            case PROMOTION -> {
                applyJobChange(target, req.newJobPosition(), req.newDepartment());
                if (req.newSalary() != null) target.setSalary(req.newSalary().doubleValue());
                record.setNewJobPosition(req.newJobPosition());
                record.setNewDepartment(req.newDepartment());
                record.setNewSalary(req.newSalary());
            }
            case DEMOTION -> {
                applyJobChange(target, req.newJobPosition(), req.newDepartment());
                if (req.newSalary() != null) target.setSalary(req.newSalary().doubleValue());
                record.setNewJobPosition(req.newJobPosition());
                record.setNewDepartment(req.newDepartment());
                record.setNewSalary(req.newSalary());
            }
            case SUSPENSION -> {
                target.setEmployeeStatus(EmployeeStatus.SUSPENDED);
                record.setEndDate(req.endDate());
            }
            case FORCED_LEAVE -> {
                target.setEmployeeStatus(EmployeeStatus.INACTIVE);
                record.setEndDate(req.endDate());
            }
            case REINSTATEMENT -> {
                target.setEmployeeStatus(EmployeeStatus.ACTIVE);
            }
            case SALARY_REVISION -> {
                if (req.newSalary() != null) target.setSalary(req.newSalary().doubleValue());
                record.setNewSalary(req.newSalary());
            }
            case TRANSFER -> {
                applyJobChange(target, req.newJobPosition(), req.newDepartment());
                record.setNewJobPosition(req.newJobPosition());
                record.setNewDepartment(req.newDepartment());
            }
            case WARNING_ISSUED -> {
                // No status change — just logged
            }
            default -> throw new IllegalArgumentException("Unsupported direct action type: " + type);
        }

        employeeRepo.save(target);
        EmployeeActionRecord saved = actionRepo.save(record);

        // NOTIFICATION: Notify the employee of the action taken against them
        String friendlyType = type.name().replace("_", " ");
        String message = buildActionMessage(type, req, initiator);
        notificationService.send(
                target.getId(),
                NotificationType.EMPLOYEE_ACTION_APPLIED,
                "HR Action: " + friendlyType,
                message,
                saved.getId(),
                "EmployeeAction"
        );

        return toResponse(saved);
    }

    private String buildActionMessage(EmployeeActionType type, EmployeeActionRequest req, Employee initiator) {
        String by = initiator.getFirstName() + " " + initiator.getLastName();
        return switch (type) {
            case PROMOTION -> "Congratulations! You have been promoted" + (req.newJobPosition() != null ? " to " + req.newJobPosition() : "") + " by " + by + ". Effective: " + (req.effectiveDate() != null ? req.effectiveDate() : "today") + ".";
            case DEMOTION -> "Your position has been revised" + (req.newJobPosition() != null ? " to " + req.newJobPosition() : "") + " by " + by + ". Reason: " + req.reason() + ".";
            case SUSPENSION -> "Your account has been suspended by " + by + " until " + (req.endDate() != null ? req.endDate() : "further notice") + ". Reason: " + req.reason() + ".";
            case FORCED_LEAVE -> "You have been placed on forced leave by " + by + " until " + (req.endDate() != null ? req.endDate() : "further notice") + ". Reason: " + req.reason() + ".";
            case REINSTATEMENT -> "Your account has been reinstated by " + by + ". You are now active again.";
            case SALARY_REVISION -> "Your salary has been revised by " + by + (req.newSalary() != null ? " to " + req.newSalary() : "") + ". Effective: " + (req.effectiveDate() != null ? req.effectiveDate() : "today") + ".";
            case TRANSFER -> "You have been transferred" + (req.newDepartment() != null ? " to " + req.newDepartment() : "") + " by " + by + ". Effective: " + (req.effectiveDate() != null ? req.effectiveDate() : "today") + ".";
            case WARNING_ISSUED -> "A formal warning has been issued to you by " + by + ". Reason: " + req.reason() + ".";
            default -> "An HR action (" + type.name() + ") has been applied to your account by " + by + ".";
        };
    }

    // ── MANAGER: submit a report / suggestion ────────────────────────────────

    @Transactional
    public EmployeeActionResponse submitManagerReport(String managerUsername, ManagerReportRequest req) {
        Employee manager = findByUsername(managerUsername);
        Employee target = employeeRepo.findById(req.employeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + req.employeeId()));

        EmployeeActionRecord record = new EmployeeActionRecord();
        record.setEmployee(target);
        record.setInitiatedBy(manager);
        record.setActionType(EmployeeActionType.MANAGER_REPORT);
        record.setStatus(EmployeeActionStatus.PENDING);
        record.setReason(req.suggestedAction() + " — " + req.reason());
        record.setEffectiveDate(LocalDate.now());

        EmployeeActionRecord saved = actionRepo.save(record);

        // NOTIFICATION: Notify HR that a manager report was submitted
        // Find all HR employees and notify them
        employeeRepo.findAll().stream()
                .filter(e -> e.getRoles().stream()
                        .anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN")))
                .forEach(hr -> notificationService.send(
                        hr.getId(),
                        NotificationType.MANAGER_REPORT_SUBMITTED,
                        "Manager Report Submitted for " + target.getFirstName() + " " + target.getLastName(),
                        manager.getFirstName() + " " + manager.getLastName() + " has submitted a report suggesting \"" + req.suggestedAction() + "\" for " + target.getFirstName() + " " + target.getLastName() + ". Reason: " + req.reason() + ". Please review.",
                        saved.getId(),
                        "EmployeeAction"
                ));

        return toResponse(saved);
    }

    // ── HR: review a manager report ──────────────────────────────────────────

    @Transactional
    public EmployeeActionResponse reviewReport(UUID recordId, String reviewerUsername,
                                               boolean approve, String reviewNotes) {
        EmployeeActionRecord record = actionRepo.findById(recordId)
                .orElseThrow(() -> new ResourceNotFoundException("Action record not found: " + recordId));
        Employee reviewer = findByUsername(reviewerUsername);

        record.setReviewedBy(reviewer);
        record.setReviewNotes(reviewNotes);
        record.setStatus(approve ? EmployeeActionStatus.APPROVED : EmployeeActionStatus.REJECTED);

        EmployeeActionRecord saved = actionRepo.save(record);

        // NOTIFICATION: Notify the manager who submitted the report
        String outcome = approve ? "approved" : "rejected";
        notificationService.send(
                record.getInitiatedBy().getId(),
                NotificationType.MANAGER_REPORT_REVIEWED,
                "Your manager report has been " + outcome,
                reviewer.getFirstName() + " " + reviewer.getLastName() + " has " + outcome + " your report regarding " + record.getEmployee().getFirstName() + " " + record.getEmployee().getLastName() + (reviewNotes != null && !reviewNotes.isBlank() ? ". Notes: " + reviewNotes : "."),
                saved.getId(),
                "EmployeeAction"
        );

        return toResponse(saved);
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    public List<EmployeeActionResponse> getActionsForEmployee(UUID employeeId) {
        return actionRepo.findByEmployeeIdOrderByCreatedAtDesc(employeeId)
                .stream().map(this::toResponse).toList();
    }

    public List<EmployeeActionResponse> getPendingReports() {
        return actionRepo.findByStatusOrderByCreatedAtDesc(EmployeeActionStatus.PENDING)
                .stream().map(this::toResponse).toList();
    }

    public List<EmployeeActionResponse> getMyReports(String managerUsername) {
        Employee manager = findByUsername(managerUsername);
        return actionRepo.findByInitiatedByIdOrderByCreatedAtDesc(manager.getId())
                .stream().map(this::toResponse).toList();
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private void applyJobChange(Employee emp, String newPositionName, String newDeptName) {
        if (newPositionName != null) {
            jobPositionRepo.findByPositionName(newPositionName).ifPresent(emp::setJobPosition);
        }
        if (newDeptName != null) {
            departmentRepo.findByName(newDeptName).ifPresent(emp::setDepartment);
        }
    }

    private Employee findByUsername(String username) {
        return employeeRepo.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found: " + username));
    }

    private EmployeeActionResponse toResponse(EmployeeActionRecord r) {
        return new EmployeeActionResponse(
                r.getId(),
                r.getEmployee().getId(),
                r.getEmployee().getFirstName() + " " + r.getEmployee().getLastName(),
                r.getInitiatedBy().getId(),
                r.getInitiatedBy().getFirstName() + " " + r.getInitiatedBy().getLastName(),
                r.getInitiatedBy().getRoles().stream()
                        .map(role -> role.getRoleName()).findFirst().orElse("UNKNOWN"),
                r.getReviewedBy() != null ? r.getReviewedBy().getId() : null,
                r.getReviewedBy() != null
                        ? r.getReviewedBy().getFirstName() + " " + r.getReviewedBy().getLastName()
                        : null,
                r.getActionType().name(),
                r.getStatus().name(),
                r.getReason(),
                r.getReviewNotes(),
                r.getEffectiveDate(),
                r.getEndDate(),
                r.getNewJobPosition(),
                r.getNewDepartment(),
                r.getNewSalary(),
                r.getPreviousJobPosition(),
                r.getPreviousDepartment(),
                r.getPreviousSalary(),
                r.getCreatedAt()
        );
    }
}