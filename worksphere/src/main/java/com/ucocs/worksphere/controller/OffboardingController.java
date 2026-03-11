package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hr.OffboardingInitiateRequest;
import com.ucocs.worksphere.dto.hr.OffboardingRecordResponse;
import com.ucocs.worksphere.service.OffboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/hr/offboarding")
@RequiredArgsConstructor
public class OffboardingController {

    private final OffboardingService offboardingService;

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<OffboardingRecordResponse> initiateOffboarding(
            @Valid @RequestBody OffboardingInitiateRequest request,
            Authentication authentication) {
        return new ResponseEntity<>(offboardingService.initiateOffboarding(request, authentication.getName()),
                HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<OffboardingRecordResponse>> getAllOffboardingRecords() {
        return ResponseEntity.ok(offboardingService.getAllOffboardingRecords());
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<OffboardingRecordResponse> getMyOffboardingRecord(Authentication authentication) {
        return ResponseEntity.ok(offboardingService.getMyOffboardingRecord(authentication.getName()));
    }

    @PutMapping("/{id}/clearance")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<OffboardingRecordResponse> updateClearance(
            @PathVariable UUID id,
            @RequestParam String department,
            @RequestParam boolean isCleared,
            Authentication authentication) {
        // Normally, you would restrict IT and Finance clearance to specific roles based
        // on the 'department' parameter.
        // E.g., if(department.equals("IT") && !auth.hasRole("IT_ADMIN")) throw
        // Forbidden.
        // For simplicity and alignment with the current role setup, HR and ADMIN can
        // override clear all.
        return ResponseEntity
                .ok(offboardingService.updateClearance(id, department, isCleared, authentication.getName()));
    }
}

