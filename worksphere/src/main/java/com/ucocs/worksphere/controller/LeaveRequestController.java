package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.LeaveSubmissionDTO;
import com.ucocs.worksphere.dto.ReviewDTO;
import com.ucocs.worksphere.entity.LeaveRequest;
import com.ucocs.worksphere.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @PostMapping("/submit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LeaveRequest> submitRequest(@RequestBody LeaveSubmissionDTO dto, Principal principal) {
        LeaveRequest request = leaveRequestService.submitRequest(
                principal.getName(),
                dto.getPolicyId(),
                dto.getStartDate(),
                dto.getEndDate(),
                dto.getRequestedDays(),
                dto.getReason()
        );
        return ResponseEntity.ok(request);
    }

    @PutMapping("/{requestId}/approve")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<LeaveRequest> approveRequest(
            @PathVariable UUID requestId,
            @RequestBody ReviewDTO dto,
            Principal principal) {
        return ResponseEntity.ok(leaveRequestService.approveRequest(requestId, principal.getName(), dto.getComment()));
    }

    @PutMapping("/{requestId}/reject")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR', 'ADMIN')")
    public ResponseEntity<LeaveRequest> rejectRequest(
            @PathVariable UUID requestId,
            @RequestBody ReviewDTO dto,
            Principal principal) {
        return ResponseEntity.ok(leaveRequestService.rejectRequest(requestId, principal.getName(), dto.getComment()));
    }
}

