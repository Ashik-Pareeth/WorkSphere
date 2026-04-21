package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hr.EmployeeActionRequest;
import com.ucocs.worksphere.dto.hr.EmployeeActionResponse;
import com.ucocs.worksphere.dto.hr.ManagerReportRequest;
import com.ucocs.worksphere.service.EmployeeActionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/employee-actions")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeActionController {

    private final EmployeeActionService actionService;

    /**
     * HR / SUPER_ADMIN: apply a direct action (promotion, demotion, suspension, etc.)
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<EmployeeActionResponse> applyAction(
            Principal principal,
            @RequestBody EmployeeActionRequest request) {
        return ResponseEntity.ok(actionService.applyAction(principal.getName(), request));
    }

    /**
     * MANAGER: submit a report / suggestion about a team member.
     */
    @PostMapping("/report")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<EmployeeActionResponse> submitReport(
            Principal principal,
            @RequestBody ManagerReportRequest request) {
        return ResponseEntity.ok(actionService.submitManagerReport(principal.getName(), request));
    }

    /**
     * HR / SUPER_ADMIN: get all pending manager reports.
     */
    @GetMapping("/pending-reports")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<List<EmployeeActionResponse>> getPendingReports() {
        return ResponseEntity.ok(actionService.getPendingReports());
    }

    /**
     * HR / SUPER_ADMIN: approve or reject a manager report.
     * Body: { "approve": true/false, "reviewNotes": "..." }
     */
    @PatchMapping("/{id}/review")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<EmployeeActionResponse> reviewReport(
            @PathVariable UUID id,
            Principal principal,
            @RequestBody Map<String, Object> body) {
        boolean approve = Boolean.TRUE.equals(body.get("approve"));
        String notes = (String) body.getOrDefault("reviewNotes", "");
        return ResponseEntity.ok(actionService.reviewReport(id, principal.getName(), approve, notes));
    }

    /**
     * HR / SUPER_ADMIN / AUDITOR: read-only view of all action records for compliance audit.
     */
    @GetMapping("/all-records")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN', 'AUDITOR')")
    public ResponseEntity<List<EmployeeActionResponse>> getAllActionRecords() {
        return ResponseEntity.ok(actionService.getAllActions());
    }

    /**
     * HR / SUPER_ADMIN / MANAGER (own reports): get action history for an employee.
     */
    @GetMapping("/employee/{employeeId}")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN', 'MANAGER','EMPLOYEE','AUDITOR')")
    public ResponseEntity<List<EmployeeActionResponse>> getActionsForEmployee(
            @PathVariable UUID employeeId) {
        return ResponseEntity.ok(actionService.getActionsForEmployee(employeeId));
    }

    /**
     * MANAGER: get their own submitted reports.
     */
    @GetMapping("/my-reports")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<EmployeeActionResponse>> getMyReports(Principal principal) {
        return ResponseEntity.ok(actionService.getMyReports(principal.getName()));
    }
}