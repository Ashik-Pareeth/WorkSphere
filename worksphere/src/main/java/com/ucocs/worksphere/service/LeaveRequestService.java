package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeavePolicy;
import com.ucocs.worksphere.entity.LeaveRequest;
import com.ucocs.worksphere.enums.LeaveRequestStatus;
import com.ucocs.worksphere.enums.LeaveTransactionType;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.LeavePolicyRepository;
import com.ucocs.worksphere.repository.LeaveRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaveRequestService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final EmployeeRepository employeeRepository;
    private final LeavePolicyRepository policyRepository;
    private final LeaveLedgerService leaveLedgerService;

    // 1. Employee Submits Request
    @Transactional
    public LeaveRequest submitRequest(String username, UUID policyId, LocalDate startDate, LocalDate endDate, double requestedDays, String reason) {
        Employee employee = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
        LeavePolicy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));

        LeaveRequest request = new LeaveRequest();
        request.setEmployee(employee);
        request.setLeavePolicy(policy);
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        request.setRequestedDays(requestedDays);
        request.setReason(reason);
        request.setStatus(LeaveRequestStatus.PENDING);
        request.setCreatedBy(username);

        return leaveRequestRepository.save(request);
    }

    // 2. Manager Approves Request (ATOMIC TRANSACTION)
    @Transactional
    public LeaveRequest approveRequest(UUID requestId, String managerUsername, String comment) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));
        Employee manager = employeeRepository.findByUserName(managerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        if (request.getStatus() != LeaveRequestStatus.PENDING) {
            throw new IllegalStateException("Only pending requests can be approved.");
        }

        // Apply Row-Level Security: Only HR/Admin or the employee's specific manager can approve
        boolean isGodMode = manager.getRoles().stream().anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN"));
        if (!isGodMode && !manager.getDepartment().getId().equals(request.getEmployee().getDepartment().getId())) {
            throw new AccessDeniedException("You can only approve requests for your own department.");
        }

        // A. Update the Request Status
        request.setStatus(LeaveRequestStatus.APPROVED);
        request.setReviewer(manager);
        request.setReviewerComment(comment);
        LeaveRequest savedRequest = leaveRequestRepository.save(request);

        // B. Automatically Deduct from the Ledger!
        // If this throws an "Insufficient balance" error, the whole approval rolls back!
        leaveLedgerService.adjustBalance(
                request.getEmployee().getId(),
                request.getLeavePolicy().getId(),
                LeaveTransactionType.DEDUCTION,
                request.getRequestedDays(),
                "Approved Leave Request from " + request.getStartDate() + " to " + request.getEndDate()
        );

        return savedRequest;
    }

    // 3. Manager Rejects Request
    @Transactional
    public LeaveRequest rejectRequest(UUID requestId, String managerUsername, String comment) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));
        Employee manager = employeeRepository.findByUserName(managerUsername)
                .orElseThrow(() -> new ResourceNotFoundException("Manager not found"));

        request.setStatus(LeaveRequestStatus.REJECTED);
        request.setReviewer(manager);
        request.setReviewerComment(comment);

        // We DO NOT deduct from the ledger on a rejection.
        return leaveRequestRepository.save(request);
    }
}