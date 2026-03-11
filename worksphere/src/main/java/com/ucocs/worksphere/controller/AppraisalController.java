package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hr.AppraisalCreateRequest;
import com.ucocs.worksphere.dto.hr.AppraisalResponse;
import com.ucocs.worksphere.dto.hr.AppraisalUpdateRatingRequest;
import com.ucocs.worksphere.service.AppraisalService;
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
@RequestMapping("/api/hr/appraisal")
@RequiredArgsConstructor
public class AppraisalController {

    private final AppraisalService appraisalService;

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<AppraisalResponse> createAppraisal(
            @Valid @RequestBody AppraisalCreateRequest request,
            Authentication authentication) {
        return new ResponseEntity<>(appraisalService.createAppraisal(request, authentication.getName()),
                HttpStatus.CREATED);
    }

    @GetMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<List<AppraisalResponse>> getAllAppraisals() {
        return ResponseEntity.ok(appraisalService.getAllAppraisals());
    }

    @GetMapping("/my")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AppraisalResponse>> getMyAppraisals(Authentication authentication) {
        return ResponseEntity.ok(appraisalService.getMyAppraisals(authentication.getName()));
    }

    @GetMapping("/team")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<AppraisalResponse>> getTeamAppraisals(Authentication authentication) {
        return ResponseEntity.ok(appraisalService.getTeamAppraisals(authentication.getName()));
    }

    @PutMapping("/{id}/self-rating")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppraisalResponse> submitSelfAppraisal(
            @PathVariable UUID id,
            @Valid @RequestBody AppraisalUpdateRatingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(appraisalService.submitSelfAppraisal(id, request, authentication.getName()));
    }

    @PutMapping("/{id}/manager-rating")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<AppraisalResponse> submitManagerAppraisal(
            @PathVariable UUID id,
            @Valid @RequestBody AppraisalUpdateRatingRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(appraisalService.submitManagerAppraisal(id, request, authentication.getName()));
    }

    @PutMapping("/{id}/acknowledge")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AppraisalResponse> acknowledgeAppraisal(
            @PathVariable UUID id,
            Authentication authentication) {
        return ResponseEntity.ok(appraisalService.acknowledgeAppraisal(id, authentication.getName()));
    }
}

