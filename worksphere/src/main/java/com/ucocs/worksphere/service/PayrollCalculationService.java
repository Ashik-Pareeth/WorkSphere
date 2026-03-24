package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hr.*;
import com.ucocs.worksphere.entity.*;
import com.ucocs.worksphere.enums.*;
import com.ucocs.worksphere.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Core payroll calculation engine.
 * Generates, processes, and manages payroll records.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PayrollCalculationService {

    private final EmployeeRepository employeeRepository;
    private final PayrollRecordRepository payrollRecordRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final AttendanceRepository attendanceRepository;
    private final TaxCalculationService taxCalculationService;
    private final PayslipPdfService payslipPdfService;
    private final AuditService auditService;
    private final NotificationService notificationService;
    private final JobPositionRepository jobPositionRepository;
    private final LeaveRequestRepository leaveRequestRepository;

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final BigDecimal TWELVE = new BigDecimal("12");

    // ==================== PAYROLL GENERATION ====================

    /**
     * Generate payroll records for a given month/year.
     * If employeeIds is null, generates for all ACTIVE employees.
     * Entire batch runs in one transaction — any failure rolls back all.
     */
    @Transactional(rollbackFor = Exception.class)
    public PayrollBatchResponse generateForMonth(PayrollGenerateRequest request, UUID performedBy) {
        int month = request.getMonth();
        int year = request.getYear();

        log.info("Starting payroll generation for {}/{} by {}", month, year, performedBy);

        List<Employee> employees;
        if (request.getEmployeeIds() != null && !request.getEmployeeIds().isEmpty()) {
            employees = request.getEmployeeIds().stream()
                    .map(id -> employeeRepository.findById(id)
                            .orElseThrow(() -> new RuntimeException("Employee not found: " + id)))
                    .filter(e -> e.getEmployeeStatus() == EmployeeStatus.ACTIVE)
                    .collect(Collectors.toList());
        } else {
            employees = employeeRepository.findByEmployeeStatus(EmployeeStatus.ACTIVE);
        }

        PayrollBatchResponse response = new PayrollBatchResponse();

        for (Employee emp : employees) {
            try {
                PayrollRecord record = calculateForEmployee(emp, month, year);
                response.getRecords().add(toResponse(record));
            } catch (Exception e) {
                log.warn("Skipping payroll for employee {} ({}): {}",
                        emp.getUserName(), emp.getId(), e.getMessage());
                response.getErrors()
                        .add("Skipped " + emp.getFirstName() + " " + emp.getLastName() + ": " + e.getMessage());
            }
        }

        log.info("Payroll generation completed. {} records generated.", response.getRecords().size());
        return response;
    }

    /**
     * Calculate payroll for a single employee.
     */
    private PayrollRecord calculateForEmployee(Employee emp, int month, int year) {
        // Check for existing record
        Optional<PayrollRecord> existingOpt = payrollRecordRepository.findByEmployeeAndMonthAndYear(emp, month, year);
        if (existingOpt.isPresent()) {
            PayrollRecord existing = existingOpt.get();
            if (existing.getStatus() != PayrollStatus.DRAFT) {
                throw new RuntimeException("Payroll already " + existing.getStatus() + " for " + emp.getUserName());
            }
            // Recalculate existing DRAFT
            payrollRecordRepository.delete(existing);
        }

        // Resolve salary structure
        SalaryStructure structure = resolveSalaryStructure(emp);
        BigDecimal grossPay;
        BigDecimal pfEmployeePercent;
        BigDecimal professionalTax;

        if (structure != null) {
            grossPay = structure.computeGross();
            pfEmployeePercent = BigDecimal.valueOf(structure.getPfEmployeePercent());
            professionalTax = structure.getProfessionalTax();
        } else {
            // Fallback to Employee.salary
            grossPay = BigDecimal.valueOf(emp.getSalary());
            pfEmployeePercent = BigDecimal.ZERO;
            professionalTax = BigDecimal.ZERO;
        }

        // Calculate working days and attendance
        YearMonth yearMonth = YearMonth.of(year, month);
        int workingDays = calculateWorkingDays(yearMonth);
        int presentDays = countPresentDays(emp, yearMonth);
        int lopDays = Math.max(0, workingDays - presentDays);

        // LOP deduction
        BigDecimal lopDeduction = BigDecimal.ZERO;
        if (lopDays > 0 && workingDays > 0) {
            lopDeduction = grossPay.divide(BigDecimal.valueOf(workingDays), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(lopDays))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // PF Deduction
        BigDecimal pfDeduction = grossPay.multiply(pfEmployeePercent)
                .divide(HUNDRED, 2, RoundingMode.HALF_UP);

        // Annual PF for tax calculation
        BigDecimal annualPf = pfDeduction.multiply(TWELVE);

        // Tax deduction (monthly TDS)
        BigDecimal taxDeduction = taxCalculationService.calculateMonthlyTax(grossPay, annualPf);

        // Net pay
        BigDecimal netPay = grossPay
                .subtract(lopDeduction)
                .subtract(pfDeduction)
                .subtract(taxDeduction)
                .subtract(professionalTax)
                .setScale(2, RoundingMode.HALF_UP);

        // Build record
        PayrollRecord record = new PayrollRecord();
        record.setEmployee(emp);
        record.setMonth(month);
        record.setYear(year);
        record.setWorkingDays(workingDays);
        record.setPresentDays(presentDays);
        record.setLopDays(lopDays);
        record.setGrossPay(grossPay);
        record.setLopDeduction(lopDeduction);
        record.setPfDeduction(pfDeduction);
        record.setTaxDeduction(taxDeduction);
        record.setProfessionalTax(professionalTax);
        record.setOtherDeductions(BigDecimal.ZERO);
        record.setNetPay(netPay);
        record.setStatus(PayrollStatus.DRAFT);

        return payrollRecordRepository.save(record);
    }

    /**
     * Resolve salary structure: employee override > job position default > null
     * (fallback).
     */
    private SalaryStructure resolveSalaryStructure(Employee emp) {
        LocalDate now = LocalDate.now();

        // Try employee-specific structure first
        Optional<SalaryStructure> empStructure = salaryStructureRepository
                .findFirstByEmployeeAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(emp, now);
        if (empStructure.isPresent()) {
            return empStructure.get();
        }

        // Try position-level default
        if (emp.getJobPosition() != null) {
            Optional<SalaryStructure> posStructure = salaryStructureRepository
                    .findFirstByJobPositionAndEffectiveDateLessThanEqualOrderByEffectiveDateDesc(
                            emp.getJobPosition(), now);
            if (posStructure.isPresent()) {
                return posStructure.get();
            }
        }

        return null;
    }

    /**
     * Count weekdays (Mon-Fri) in a month as working days.
     */
    private int calculateWorkingDays(YearMonth yearMonth) {
        int count = 0;
        LocalDate date = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();
        while (!date.isAfter(end)) {
            DayOfWeek dow = date.getDayOfWeek();
            if (dow != DayOfWeek.SATURDAY && dow != DayOfWeek.SUNDAY) {
                count++;
            }
            date = date.plusDays(1);
        }
        return count;
    }


    /**
     * Count the number of present / working days from attendance records.
     * Counts PRESENT, LATE, HALF_DAY, and paid ON_LEAVE statuses.
     */
    private int countPresentDays(Employee emp, YearMonth yearMonth) {
        LocalDate start = yearMonth.atDay(1);
        LocalDate end = yearMonth.atEndOfMonth();

        List<Attendance> records = attendanceRepository.findByEmployee(emp);
        if (records == null || records.isEmpty()) {
            return 0;
        }

        // Fetch employee's leave requests to check for paid/unpaid status during ON_LEAVE days
        List<LeaveRequest> allLeaves = leaveRequestRepository.findByEmployeeOrderByCreatedAtDesc(emp);

        int count = 0;
        for (Attendance att : records) {
            if (att.getDate() != null
                    && !att.getDate().isBefore(start)
                    && !att.getDate().isAfter(end)) {

                DailyStatus status = att.getDailyStatus();

                if (status == DailyStatus.PRESENT || status == DailyStatus.LATE) {
                    count++;
                } else if (status == DailyStatus.HALF_DAY_MORNING || status == DailyStatus.HALF_DAY_AFTERNOON) {
                    // Count half day as full day for payroll simplification (or change to 0.5 if using double)
                    count++;
                } else if (status == DailyStatus.ON_LEAVE) {
                    // Check if this specific day falls under an approved, PAID leave request
                    boolean isPaidLeave = allLeaves.stream()
                            .filter(lr -> lr.getStatus() == LeaveRequestStatus.APPROVED)
                            .filter(lr -> !att.getDate().isBefore(lr.getStartDate()) && !att.getDate().isAfter(lr.getEndDate()))
                            .findFirst()
                            .map(lr -> {
                                Boolean isUnpaid = lr.getLeavePolicy().getIsUnpaid();
                                return isUnpaid != null && !isUnpaid; // True if it is NOT an unpaid leave
                            })
                            .orElse(false);

                    if (isPaidLeave) {
                        count++;
                    }
                }
            }
        }
        return count;
    }
    // ==================== PROCESS & MARK PAID ====================

    @Transactional
    public PayrollRecordResponse processRecord(UUID recordId, UUID performedBy) {
        PayrollRecord record = payrollRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Payroll record not found: " + recordId));

        if (record.getStatus() != PayrollStatus.DRAFT) {
            throw new RuntimeException("Only DRAFT records can be processed. Current status: " + record.getStatus());
        }

        // Generate PDF payslip
        Employee emp = record.getEmployee();
        String payslipPath = payslipPdfService.generatePayslip(record, emp);
        record.setPayslipUrl(payslipPath);

        record.setStatus(PayrollStatus.PROCESSED);
        record.setProcessedBy(performedBy);
        record.setProcessedAt(LocalDateTime.now());
        payrollRecordRepository.save(record);

        // Audit
        auditService.log("PayrollRecord", record.getId(), AuditAction.UPDATED, performedBy,
                null, "DRAFT", "PROCESSED", "Payroll processed");

        // Notify employee
        notificationService.send(
                emp.getId(),
                NotificationType.PAYSLIP_READY,
                "Payslip Ready",
                "Your payslip for " + record.getMonth() + "/" + record.getYear() + " is ready for download.",
                record.getId(),
                "PayrollRecord");

        log.info("Payroll record {} processed by {}", recordId, performedBy);
        return toResponse(record);
    }

    @Transactional
    public PayrollRecordResponse markPaid(UUID recordId, UUID performedBy) {
        PayrollRecord record = payrollRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Payroll record not found: " + recordId));

        if (record.getStatus() != PayrollStatus.PROCESSED) {
            throw new RuntimeException(
                    "Only PROCESSED records can be marked PAID. Current status: " + record.getStatus());
        }

        record.setStatus(PayrollStatus.PAID);
        payrollRecordRepository.save(record);

        auditService.log("PayrollRecord", record.getId(), AuditAction.UPDATED, performedBy,
                null, "PROCESSED", "PAID", "Payroll marked as paid");

        log.info("Payroll record {} marked PAID by {}", recordId, performedBy);
        return toResponse(record);
    }

    // ==================== QUERY METHODS ====================

    public List<PayrollRecordResponse> getEmployeePayrollHistory(UUID employeeId) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));
        return payrollRecordRepository.findByEmployeeOrderByYearDescMonthDesc(emp)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PayrollRecordResponse> getMyPayrollHistory(String username) {
        Employee emp = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + username));
        return payrollRecordRepository.findByEmployeeOrderByYearDescMonthDesc(emp)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    public List<PayrollRecordResponse> getMonthlySummary(int month, int year) {
        return payrollRecordRepository.findByMonthAndYear(month, year)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ==================== SALARY STRUCTURE MANAGEMENT ====================

    @Transactional
    public SalaryStructureResponse saveSalaryStructure(SalaryStructureRequest request, UUID performedBy) {
        SalaryStructure structure = new SalaryStructure();
        structure.setBaseSalary(request.getBaseSalary());
        structure.setHra(request.getHra());
        structure.setDa(request.getDa());
        structure.setTravelAllowance(request.getTravelAllowance());
        structure.setOtherAllowances(request.getOtherAllowances());
        structure.setPfEmployeePercent(request.getPfEmployeePercent());
        structure.setPfEmployerPercent(request.getPfEmployerPercent());
        structure.setProfessionalTax(request.getProfessionalTax());
        structure.setEffectiveDate(request.getEffectiveDate());

        if (request.getEmployeeId() != null) {
            Employee emp = employeeRepository.findById(request.getEmployeeId())
                    .orElseThrow(() -> new RuntimeException("Employee not found: " + request.getEmployeeId()));

            // Delete existing employee-level structure if present
            salaryStructureRepository.findByEmployee(emp).ifPresent(salaryStructureRepository::delete);

            structure.setEmployee(emp);
        } else if (request.getJobPositionId() != null) {
            JobPosition pos = jobPositionRepository.findById(request.getJobPositionId())
                    .orElseThrow(() -> new RuntimeException("Job position not found: " + request.getJobPositionId()));
            structure.setJobPosition(pos);
        } else {
            throw new RuntimeException("Either employeeId or jobPositionId must be provided");
        }

        structure = salaryStructureRepository.save(structure);

        auditService.log("SalaryStructure", structure.getId(), AuditAction.CREATED, performedBy,
                null, null, structure.getBaseSalary().toString(), "Salary structure created");

        return toStructureResponse(structure);
    }

    public SalaryStructureResponse getSalaryStructure(UUID employeeId) {
        Employee emp = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + employeeId));

        SalaryStructure structure = resolveSalaryStructure(emp);
        if (structure == null) {
            // Return a default response from Employee.salary
            return SalaryStructureResponse.builder()
                    .employeeId(emp.getId())
                    .employeeName(emp.getFirstName() + " " + emp.getLastName())
                    .baseSalary(BigDecimal.valueOf(emp.getSalary()))
                    .hra(BigDecimal.ZERO)
                    .da(BigDecimal.ZERO)
                    .travelAllowance(BigDecimal.ZERO)
                    .otherAllowances(BigDecimal.ZERO)
                    .pfEmployeePercent(0.0)
                    .pfEmployerPercent(0.0)
                    .professionalTax(BigDecimal.ZERO)
                    .effectiveDate(LocalDate.now())
                    .build();
        }
        return toStructureResponse(structure);
    }

    // ==================== PAYSLIP FILE ACCESS ====================

    public String getPayslipPath(UUID recordId) {
        PayrollRecord record = payrollRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("Payroll record not found: " + recordId));
        if (record.getPayslipUrl() == null || record.getPayslipUrl().isEmpty()) {
            throw new RuntimeException("Payslip not yet generated for this record");
        }
        return record.getPayslipUrl();
    }

    // ==================== MAPPERS ====================

    private PayrollRecordResponse toResponse(PayrollRecord record) {
        Employee emp = record.getEmployee();
        return PayrollRecordResponse.builder()
                .id(record.getId())
                .employeeId(emp.getId())
                .employeeName(emp.getFirstName() + " " + emp.getLastName())
                .department(emp.getDepartment() != null ? emp.getDepartment().getName() : "N/A")
                .month(record.getMonth())
                .year(record.getYear())
                .workingDays(record.getWorkingDays())
                .presentDays(record.getPresentDays())
                .lopDays(record.getLopDays())
                .grossPay(record.getGrossPay())
                .lopDeduction(record.getLopDeduction())
                .pfDeduction(record.getPfDeduction())
                .taxDeduction(record.getTaxDeduction())
                .professionalTax(record.getProfessionalTax())
                .otherDeductions(record.getOtherDeductions())
                .netPay(record.getNetPay())
                .status(record.getStatus())
                .processedAt(record.getProcessedAt())
                .payslipDownloadUrl(record.getPayslipUrl() != null
                        ? "/api/hr/payroll/" + record.getId() + "/payslip"
                        : null)
                .build();
    }

    private SalaryStructureResponse toStructureResponse(SalaryStructure s) {
        return SalaryStructureResponse.builder()
                .id(s.getId())
                .baseSalary(s.getBaseSalary())
                .hra(s.getHra())
                .da(s.getDa())
                .travelAllowance(s.getTravelAllowance())
                .otherAllowances(s.getOtherAllowances())
                .pfEmployeePercent(s.getPfEmployeePercent())
                .pfEmployerPercent(s.getPfEmployerPercent())
                .professionalTax(s.getProfessionalTax())
                .effectiveDate(s.getEffectiveDate())
                .employeeId(s.getEmployee() != null ? s.getEmployee().getId() : null)
                .employeeName(s.getEmployee() != null
                        ? s.getEmployee().getFirstName() + " " + s.getEmployee().getLastName()
                        : null)
                .jobPositionId(s.getJobPosition() != null ? s.getJobPosition().getId() : null)
                .jobPositionName(s.getJobPosition() != null ? s.getJobPosition().getPositionName() : null)
                .build();
    }
}
