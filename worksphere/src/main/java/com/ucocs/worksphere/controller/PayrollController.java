package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hr.*;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.service.PayrollCalculationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr/payroll")
@RequiredArgsConstructor
public class PayrollController {

    private final PayrollCalculationService payrollCalculationService;
    private final EmployeeRepository employeeRepository;

    // ==================== PAYROLL GENERATION ====================

    @PostMapping("/generate")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<PayrollBatchResponse> generatePayroll(
            @Valid @RequestBody PayrollGenerateRequest request,
            Authentication authentication) {
        UUID performedBy = resolveEmployeeId(authentication);
        return new ResponseEntity<>(payrollCalculationService.generateForMonth(request, performedBy),
                HttpStatus.CREATED);
    }

    @GetMapping("/summary")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<PayrollRecordResponse>> getMonthlySummary(
            @RequestParam int month, @RequestParam int year) {
        return ResponseEntity.ok(payrollCalculationService.getMonthlySummary(month, year));
    }

    // ==================== EMPLOYEE HISTORY ====================

    @GetMapping("/employee/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<PayrollRecordResponse>> getEmployeePayroll(@PathVariable UUID id) {
        return ResponseEntity.ok(payrollCalculationService.getEmployeePayrollHistory(id));
    }

    @GetMapping("/my")
    public ResponseEntity<List<PayrollRecordResponse>> getMyPayroll(Authentication authentication) {
        return ResponseEntity.ok(payrollCalculationService.getMyPayrollHistory(authentication.getName()));
    }

    // ==================== STATUS TRANSITIONS ====================

    @PutMapping("/{id}/process")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<PayrollRecordResponse> processPayroll(
            @PathVariable UUID id, Authentication authentication) {
        UUID performedBy = resolveEmployeeId(authentication);
        return ResponseEntity.ok(payrollCalculationService.processRecord(id, performedBy));
    }

    @PutMapping("/{id}/mark-paid")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<PayrollRecordResponse> markPaid(
            @PathVariable UUID id, Authentication authentication) {
        UUID performedBy = resolveEmployeeId(authentication);
        return ResponseEntity.ok(payrollCalculationService.markPaid(id, performedBy));
    }

    // ==================== PAYSLIP DOWNLOAD ====================

    @GetMapping("/{id}/payslip")
    public ResponseEntity<Resource> downloadPayslip(@PathVariable UUID id) {
        String path = payrollCalculationService.getPayslipPath(id);
        File file = new File(path);
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }

    // ==================== SALARY STRUCTURE ====================

    @PostMapping("/salary-structure")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<SalaryStructureResponse> saveSalaryStructure(
            @Valid @RequestBody SalaryStructureRequest request,
            Authentication authentication) {
        UUID performedBy = resolveEmployeeId(authentication);
        return new ResponseEntity<>(payrollCalculationService.saveSalaryStructure(request, performedBy),
                HttpStatus.CREATED);
    }

    @GetMapping("/salary-structure/{employeeId}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<SalaryStructureResponse> getSalaryStructure(@PathVariable UUID employeeId) {
        return ResponseEntity.ok(payrollCalculationService.getSalaryStructure(employeeId));
    }

    @GetMapping("/salary-structure-template/{jobPositionId}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<SalaryStructureResponse> getSalaryStructureTemplate(@PathVariable UUID jobPositionId) {
        return ResponseEntity.ok(payrollCalculationService.getSalaryStructureTemplate(jobPositionId));
    }

    // ==================== HELPER ====================

    private UUID resolveEmployeeId(Authentication authentication) {
        String username = authentication.getName();
        Employee emp = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("Employee not found: " + username));
        return emp.getId();
    }
}

