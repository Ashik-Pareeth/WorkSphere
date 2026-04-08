package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hr.OffboardingInitiateRequest;
import com.ucocs.worksphere.dto.hr.OffboardingRecordResponse;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.OffboardingRecord;
import com.ucocs.worksphere.enums.AuditAction;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.enums.OffboardingStatus;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.OffboardingRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OffboardingService {

    private final OffboardingRecordRepository offboardingRepository;
    private final EmployeeRepository employeeRepository;
    private final AssetManagementService assetManagementService;
    private final AuditService auditService;
    private final NotificationService notificationService;

    /**
     * Initiate offboarding for an employee (HR Action)
     */
    @Transactional
    public OffboardingRecordResponse initiateOffboarding(OffboardingInitiateRequest request,
            String initiatedByUsername) {
        Employee initiator = resolveEmployee(initiatedByUsername);
        Employee employee = employeeRepository.findById(request.getEmployeeId())
                .orElseThrow(() -> new RuntimeException("Employee not found: " + request.getEmployeeId()));

        if (offboardingRepository.findByEmployee(employee).isPresent()) {
            throw new RuntimeException("Offboarding already initiated for this employee");
        }

        boolean hasAssets = !assetManagementService.getAssetsForEmployee(employee.getId()).isEmpty();
        OffboardingStatus initialStatus = hasAssets ? OffboardingStatus.PENDING_ASSET_RETURN
                : OffboardingStatus.IN_PROGRESS;

        OffboardingRecord record = OffboardingRecord.builder()
                .employee(employee)
                .reason(request.getReason())
                .status(initialStatus)
                .lastWorkingDay(request.getLastWorkingDay())
                .initiatedAt(LocalDateTime.now())
                .remarks(request.getRemarks())
                .itClearance(false)
                .hrClearance(false)
                .financeClearance(false)
                .build();

        OffboardingRecord saved = offboardingRepository.save(record);

        auditService.log("OffboardingRecord", saved.getId(), AuditAction.CREATED,
                initiator.getId(), null,
                "Initiated offboarding for " + employee.getUserName() + " due to " + request.getReason());

        notificationService.send(
                employee.getId(),
                NotificationType.OFFBOARDING_INITIATED,
                "Offboarding Initiated",
                "Your offboarding process has been initiated. Your last working day is recorded as "
                        + request.getLastWorkingDay() + ".",
                saved.getId(),
                "OffboardingRecord");

        if (employee.getManager() != null) {
            notificationService.send(
                    employee.getManager().getId(),
                    NotificationType.OFFBOARDING_INITIATED,
                    "Offboarding Initiated: " + employee.getFirstName() + " " + employee.getLastName(),
                    "The offboarding process has been started for your direct report.",
                    saved.getId(),
                    "OffboardingRecord");
        }

        // Additional notification to IT if assets need to be returned
        if (hasAssets) {
            // Ideally notify IT group. For now, we simulate by relying on the
            // PENDING_ASSET_RETURN status.
            log.info("Employee {} has pending assets to return.", employee.getUserName());
        }

        return toResponse(saved);
    }

    /**
     * Update clearances (IT, HR, Finance)
     */
    @Transactional
    public OffboardingRecordResponse updateClearance(UUID recordId, String department, boolean isCleared,
            String performedByUsername) {
        Employee performer = resolveEmployee(performedByUsername);
        OffboardingRecord record = offboardingRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Offboarding record not found: " + recordId));

        boolean isHRorAdmin = performer.getRoles().stream()
                .anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN"));

        boolean hasDepartmentRole = performer.getRoles().stream()
                .anyMatch(r -> r.getRoleName().toUpperCase().endsWith(department.toUpperCase()));

        if (!isHRorAdmin && !hasDepartmentRole) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You do not have permission to grant " + department + " clearance.");
        }

        String clearanceField = "";
        switch (department.toUpperCase()) {
            case "IT":
                if (isCleared && !assetManagementService.getAssetsForEmployee(record.getEmployee().getId()).isEmpty()) {
                    throw new RuntimeException("Cannot grant IT clearance while employee still has assigned assets.");
                }
                record.setItClearance(isCleared);
                clearanceField = "IT Clearance";
                break;
            case "HR":
                record.setHrClearance(isCleared);
                clearanceField = "HR Clearance";
                break;
            case "FINANCE":
                record.setFinanceClearance(isCleared);
                clearanceField = "Finance Clearance";
                break;
            default:
                throw new IllegalArgumentException("Unknown clearance department: " + department);
        }

        // Auto-progress status if conditions are met
        if (record.getStatus() == OffboardingStatus.PENDING_ASSET_RETURN && record.getItClearance()) {
            record.setStatus(OffboardingStatus.IN_PROGRESS);
        }

        if (record.getItClearance() && record.getHrClearance() && record.getFinanceClearance()) {
            record.setStatus(OffboardingStatus.COMPLETED);
        }

        Employee offboardedEmployee = record.getEmployee();
        if (record.getReason() == com.ucocs.worksphere.enums.OffboardingReason.TERMINATION) {
            offboardedEmployee.setEmployeeStatus(com.ucocs.worksphere.enums.EmployeeStatus.TERMINATED);
        } else {
            offboardedEmployee.setEmployeeStatus(com.ucocs.worksphere.enums.EmployeeStatus.RESIGNED);
        }
        employeeRepository.save(offboardedEmployee);

        OffboardingRecord saved = offboardingRepository.save(record);

        auditService.log("OffboardingRecord", saved.getId(), AuditAction.UPDATED,
                performer.getId(), null, clearanceField + " set to " + isCleared);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<OffboardingRecordResponse> getAllOffboardingRecords() {
        return offboardingRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OffboardingRecordResponse getMyOffboardingRecord(String username) {
        Employee employee = resolveEmployee(username);
        return offboardingRepository.findByEmployee(employee)
                .map(this::toResponse)
                .orElseThrow(() -> new RuntimeException("No active offboarding record found for employee"));
    }

    private Employee resolveEmployee(String username) {
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + username));
    }

    private OffboardingRecordResponse toResponse(OffboardingRecord record) {
        return OffboardingRecordResponse.builder()
                .id(record.getId())
                .employeeId(record.getEmployee().getId())
                .employeeName(record.getEmployee().getFirstName() + " " + record.getEmployee().getLastName())
                .reason(record.getReason())
                .status(record.getStatus())
                .lastWorkingDay(record.getLastWorkingDay())
                .initiatedAt(record.getInitiatedAt())
                .remarks(record.getRemarks())
                .itClearance(record.getItClearance())
                .hrClearance(record.getHrClearance())
                .financeClearance(record.getFinanceClearance())
                .build();
    }
}
