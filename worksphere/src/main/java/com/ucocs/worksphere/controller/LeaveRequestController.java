package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.LeaveRequestResponseDTO;
import com.ucocs.worksphere.dto.LeaveSubmissionDTO;
import com.ucocs.worksphere.dto.ReviewDTO;
import com.ucocs.worksphere.entity.LeaveRequest;
import com.ucocs.worksphere.service.LeaveRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/leave-requests")
@RequiredArgsConstructor
public class LeaveRequestController {

    private final LeaveRequestService leaveRequestService;

    @PostMapping("/submit")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LeaveRequestResponseDTO> submitRequest(@RequestBody LeaveSubmissionDTO dto,
            Principal principal) {
        LeaveRequest request = leaveRequestService.submitRequest(
                principal.getName(),
                dto.getPolicyId(),
                dto.getStartDate(),
                dto.getEndDate(),
                dto.getRequestedDays(),
                dto.getReason());
        return ResponseEntity.ok(LeaveRequestResponseDTO.fromEntity(request));
    }

    @PutMapping("/{requestId}/approve")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<LeaveRequestResponseDTO> approveRequest(
            @PathVariable UUID requestId,
            @RequestBody ReviewDTO dto,
            Principal principal) {
        LeaveRequest request = leaveRequestService.approveRequest(requestId, principal.getName(), dto.getComment());
        return ResponseEntity.ok(LeaveRequestResponseDTO.fromEntity(request));
    }

    @PutMapping("/{requestId}/reject")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<LeaveRequestResponseDTO> rejectRequest(
            @PathVariable UUID requestId,
            @RequestBody ReviewDTO dto,
            Principal principal) {
        LeaveRequest request = leaveRequestService.rejectRequest(requestId, principal.getName(), dto.getComment());
        return ResponseEntity.ok(LeaveRequestResponseDTO.fromEntity(request));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<List<LeaveRequestResponseDTO>> getPendingRequests(Principal principal) {
        List<LeaveRequest> requests = leaveRequestService.getPendingRequests(principal.getName());
        List<LeaveRequestResponseDTO> dtos = requests.stream()
                .map(LeaveRequestResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{requestId}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<LeaveRequestResponseDTO> cancelRequest(
            @PathVariable UUID requestId,
            Principal principal) {
        LeaveRequest request = leaveRequestService.cancelRequest(requestId, principal.getName());
        return ResponseEntity.ok(LeaveRequestResponseDTO.fromEntity(request));
    }

    @GetMapping("/my-requests")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<LeaveRequestResponseDTO>> getMyRequests(Principal principal) {
        List<LeaveRequest> requests = leaveRequestService.getMyRequests(principal.getName());
        List<LeaveRequestResponseDTO> dtos = requests.stream()
                .map(LeaveRequestResponseDTO::fromEntity)
                .toList();
        return ResponseEntity.ok(dtos);
    }
}

