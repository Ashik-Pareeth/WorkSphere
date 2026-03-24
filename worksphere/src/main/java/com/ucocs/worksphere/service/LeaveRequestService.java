package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.LeavePolicy;
import com.ucocs.worksphere.entity.LeaveRequest;
import com.ucocs.worksphere.enums.LeaveRequestStatus;
import com.ucocs.worksphere.enums.LeaveTransactionType;
import com.ucocs.worksphere.enums.NotificationType;
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
        private final NotificationService notificationService; // ADDED

        // 1. Employee Submits Request
        @Transactional
        public LeaveRequest submitRequest(String username, UUID policyId, LocalDate startDate, LocalDate endDate,
                                          double requestedDays, String reason) {
                Employee employee = employeeRepository.findByUserName(username)
                        .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
                LeavePolicy policy = policyRepository.findById(policyId)
                        .orElseThrow(() -> new ResourceNotFoundException("Policy not found"));

                boolean hasOverlap = leaveRequestRepository
                        .existsByEmployee_IdAndStatusInAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
                                employee.getId(),
                                List.of(LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED),
                                endDate,
                                startDate);

                if (hasOverlap) {
                        throw new IllegalStateException(
                                "You already have a pending or approved leave request during this period.");
                }

                LeaveRequest request = new LeaveRequest();
                request.setEmployee(employee);
                request.setLeavePolicy(policy);
                request.setStartDate(startDate);
                request.setEndDate(endDate);
                request.setRequestedDays(requestedDays);
                request.setReason(reason);
                request.setStatus(LeaveRequestStatus.PENDING);
                request.setCreatedBy(username);

                LeaveRequest saved = leaveRequestRepository.save(request);

                // NOTIFICATION: Confirm to employee that request was submitted
                notificationService.send(
                        employee.getId(),
                        NotificationType.LEAVE_SUBMITTED,
                        "Leave Request Submitted",
                        "Your " + policy.getName() + " leave request from " + startDate + " to " + endDate + " has been submitted and is pending approval.",
                        saved.getId(),
                        "LeaveRequest"
                );

                // NOTIFICATION: Notify the employee's manager (if assigned)
                if (employee.getManager() != null) {
                        notificationService.send(
                                employee.getManager().getId(),
                                NotificationType.LEAVE_SUBMITTED,
                                "New Leave Request from " + employee.getFirstName() + " " + employee.getLastName(),
                                employee.getFirstName() + " " + employee.getLastName() + " has requested " + requestedDays + " day(s) of " + policy.getName() + " leave (" + startDate + " to " + endDate + "). Please review and action it.",
                                saved.getId(),
                                "LeaveRequest"
                        );
                }

                return saved;
        }

        @Transactional(readOnly = true)
        public List<LeaveRequest> getMyRequests(String username) {
                Employee employee = employeeRepository.findByUserName(username)
                        .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));
                return leaveRequestRepository.findByEmployeeOrderByCreatedAtDesc(employee);
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

                validateReviewerAuthorization(manager, request);

                request.setStatus(LeaveRequestStatus.APPROVED);
                request.setReviewer(manager);
                request.setReviewerComment(comment);
                LeaveRequest savedRequest = leaveRequestRepository.save(request);

                leaveLedgerService.adjustBalance(
                        request.getEmployee().getId(),
                        request.getLeavePolicy().getId(),
                        LeaveTransactionType.DEDUCTION,
                        request.getRequestedDays(),
                        "Approved Leave Request from " + request.getStartDate() + " to "
                                + request.getEndDate());

                // NOTIFICATION: Inform employee of approval
                notificationService.send(
                        request.getEmployee().getId(),
                        NotificationType.LEAVE_APPROVED,
                        "Leave Request Approved",
                        "Your leave request from " + request.getStartDate() + " to " + request.getEndDate() + " has been approved by " + manager.getFirstName() + " " + manager.getLastName() + (comment != null && !comment.isBlank() ? ". Note: " + comment : "."),
                        savedRequest.getId(),
                        "LeaveRequest"
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

                validateReviewerAuthorization(manager, request);

                request.setStatus(LeaveRequestStatus.REJECTED);
                request.setReviewer(manager);
                request.setReviewerComment(comment);
                LeaveRequest saved = leaveRequestRepository.save(request);

                // NOTIFICATION: Inform employee of rejection
                notificationService.send(
                        request.getEmployee().getId(),
                        NotificationType.LEAVE_REJECTED,
                        "Leave Request Rejected",
                        "Your leave request from " + request.getStartDate() + " to " + request.getEndDate() + " has been rejected" + (comment != null && !comment.isBlank() ? ". Reason: " + comment : "."),
                        saved.getId(),
                        "LeaveRequest"
                );

                return saved;
        }

        // 4. Get Pending Requests (for Manager/HR/Admin approval flow)
        @Transactional(readOnly = true)
        public List<LeaveRequest> getPendingRequests(String username) {
                Employee reviewer = employeeRepository.findByUserName(username)
                        .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

                boolean isHrOrAdmin = reviewer.getRoles().stream()
                        .anyMatch(r -> r.getRoleName().endsWith("HR")
                                || r.getRoleName().endsWith("ADMIN"));

                if (isHrOrAdmin) {
                        return leaveRequestRepository.findAllByStatusWithDetails(LeaveRequestStatus.PENDING);
                }

                if (reviewer.getDepartment() == null) {
                        throw new AccessDeniedException("Cannot determine your department for approvals.");
                }
                return leaveRequestRepository.findByDepartmentAndStatusWithDetails(
                        reviewer.getDepartment().getId(), LeaveRequestStatus.PENDING);
        }

        private void validateReviewerAuthorization(Employee manager, LeaveRequest request) {
                if (manager.getId().equals(request.getEmployee().getId())) {
                        throw new AccessDeniedException("You cannot approve or reject your own leave requests.");
                }

                boolean isGodMode = manager.getRoles().stream()
                        .anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN"));

                if (!isGodMode) {
                        if (manager.getDepartment() == null) {
                                throw new AccessDeniedException("Cannot determine your department for approvals.");
                        }
                        if (request.getEmployee().getManager() == null ||
                                !request.getEmployee().getManager().getId().equals(manager.getId())) {
                                throw new AccessDeniedException(
                                        "You can only approve or reject leaves for your direct reports.");
                        }
                }
        }

        @Transactional
        public LeaveRequest cancelRequest(UUID requestId, String username) {
                LeaveRequest request = leaveRequestRepository.findById(requestId)
                        .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));
                Employee employee = employeeRepository.findByUserName(username)
                        .orElseThrow(() -> new ResourceNotFoundException("Employee not found"));

                boolean isGodMode = employee.getRoles().stream()
                        .anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN"));

                if (!isGodMode && !request.getEmployee().getId().equals(employee.getId())) {
                        throw new AccessDeniedException("You can only cancel your own leave requests.");
                }

                if (request.getStatus() == LeaveRequestStatus.REJECTED
                        || request.getStatus() == LeaveRequestStatus.CANCELLED) {
                        throw new IllegalStateException("This request is already cancelled or rejected.");
                }

                if (request.getStatus() == LeaveRequestStatus.APPROVED) {
                        leaveLedgerService.adjustBalance(
                                request.getEmployee().getId(),
                                request.getLeavePolicy().getId(),
                                LeaveTransactionType.ACCRUAL,
                                request.getRequestedDays(),
                                "Cancelled Approved Leave Request from " + request.getStartDate() + " to "
                                        + request.getEndDate());
                }

                request.setStatus(LeaveRequestStatus.CANCELLED);
                LeaveRequest saved = leaveRequestRepository.save(request);

                // NOTIFICATION: Confirm cancellation to the employee (if they didn't cancel it themselves, e.g. HR cancelled it)
                if (!request.getEmployee().getId().equals(employee.getId())) {
                        notificationService.send(
                                request.getEmployee().getId(),
                                NotificationType.LEAVE_CANCELLED,
                                "Leave Request Cancelled",
                                "Your leave request from " + request.getStartDate() + " to " + request.getEndDate() + " has been cancelled by " + employee.getFirstName() + " " + employee.getLastName() + ".",
                                saved.getId(),
                                "LeaveRequest"
                        );
                }

                return saved;
        }
}