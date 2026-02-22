package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.LeavePolicy;
import com.ucocs.worksphere.service.LeavePolicyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/leave-policies")
@RequiredArgsConstructor
public class LeavePolicyController {

    private final LeavePolicyService policyService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LeavePolicy>> getAllPolicies() {
        return ResponseEntity.ok(policyService.getAllPolicies());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('HR', 'ADMIN')")
    public ResponseEntity<LeavePolicy> createPolicy(@RequestBody LeavePolicy policy) {
        return ResponseEntity.ok(policyService.createPolicy(policy));
    }
}