package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.*;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.service.EmployeeService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/employees")
@RestController
public class EmployeeController {
    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService myService) {
        this.employeeService = myService;
    }

    @GetMapping("/bonus")
    @PreAuthorize("isAuthenticated()")
    public double getBonus(@RequestParam double salary) {

        return employeeService.calculateBonus(salary);
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public void createEmployee(@RequestBody CreateEmployeeRequest request) {

        employeeService.saveEmployee(request);
    }

    @PostMapping("/activate")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> activateAccount(Principal principal,
            @Valid @RequestBody ActivateAccountRequest accountRequest) {
        String password = accountRequest.password();
        String phoneNumber = accountRequest.phoneNumber();
        employeeService.activateEmployee(principal.getName(), password, phoneNumber);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/photo")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadProfilePic(
            Principal principal, @RequestParam("profilePic") MultipartFile multipartFile) {
        employeeService.uploadProfilePic(principal.getName(), multipartFile);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'SUPER_ADMIN', 'AUDITOR')")
    public List<EmployeeResponseDTO> getAllEmployee() {
        return employeeService.getAllEmployees();
    }

    @GetMapping("/my-team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<EmployeeResponseDTO>> getMyTeam(Principal principal) {
        return ResponseEntity.ok(employeeService.getMyTeam(principal.getName()));
    }

    @GetMapping("/archived")
    @PreAuthorize("hasAnyRole('HR', 'SUPER_ADMIN')")
    public ResponseEntity<List<ArchivedEmployeeDTO>> getArchivedEmployees() {
        return ResponseEntity.ok(employeeService.getArchivedEmployees());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Void> updateEmployee(
            @PathVariable UUID id,
            @RequestBody CreateEmployeeRequest request) {

        employeeService.updateEmployee(id, request);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/roles")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> updateEmployeeRoles(
            @PathVariable UUID id,
            @RequestBody List<UUID> roleIds) {
        employeeService.updateEmployeeRoles(id, roleIds);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Void> deleteEmployee(@PathVariable UUID id) {

        employeeService.deleteEmployee(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/finalize-hire")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<com.ucocs.worksphere.entity.Employee> finalizeHire(
            @RequestBody com.ucocs.worksphere.dto.hiring.FinalizeHireRequest request) {
        return ResponseEntity.ok(employeeService.finalizeHire(request));
    }


    @GetMapping("/{id}")
    public ResponseEntity<EmployeeResponseDTO> getEmployeeById(@PathVariable UUID id) {
        EmployeeResponseDTO employeeDTO = employeeService.getEmployeeById(id);
        return ResponseEntity.ok(employeeDTO);
    }

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<EmployeeResponseDTO> getCurrentUser(Principal principal) {
        EmployeeResponseDTO currentEmployee = employeeService.getCurrentEmployee(principal.getName());
        return ResponseEntity.ok(currentEmployee);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<EmployeeResponseDTO> updateEmployeeStatus(
            @PathVariable UUID id,
            @RequestBody UpdateStatusRequest request,
            Principal principal) {
        // Resolve the authenticated user's UUID using the existing pattern
        UUID performedBy = employeeService.getCurrentEmployee(principal.getName()).id();
        Employee saved = employeeService.updateEmployeeStatus(id, request.status(), performedBy);
        EmployeeResponseDTO dto = EmployeeResponseDTO.fromEntity(saved);
        return ResponseEntity.ok(dto);
    }

}

