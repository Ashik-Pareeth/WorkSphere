package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.LeaveRequest;

import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO for LeaveRequest responses.
 * Flattens lazy-loaded relationships (Employee, LeavePolicy) into safe,
 * serializable fields.
 */
public record LeaveRequestResponseDTO(
        UUID id,
        String status,
        LocalDate startDate,
        LocalDate endDate,
        Double requestedDays,
        String reason,
        String reviewerComment,
        EmployeeSummary employee,
        PolicySummary leavePolicy,
        java.time.LocalDateTime createdAt,
        String createdBy,
        java.time.LocalDateTime updatedAt,
        String updatedBy) {
    public record EmployeeSummary(UUID id, String firstName, String lastName) {
    }

    public record PolicySummary(UUID id, String name) {
    }

    public static LeaveRequestResponseDTO fromEntity(LeaveRequest lr) {
        return new LeaveRequestResponseDTO(
                lr.getId(),
                lr.getStatus() != null ? lr.getStatus().name() : null,
                lr.getStartDate(),
                lr.getEndDate(),
                lr.getRequestedDays(),
                lr.getReason(),
                lr.getReviewerComment(),
                lr.getEmployee() != null
                        ? new EmployeeSummary(
                                lr.getEmployee().getId(),
                                lr.getEmployee().getFirstName(),
                                lr.getEmployee().getLastName())
                        : null,
                lr.getLeavePolicy() != null
                        ? new PolicySummary(
                                lr.getLeavePolicy().getId(),
                                lr.getLeavePolicy().getName())
                        : null,
                lr.getCreatedAt(),
                lr.getCreatedBy(),
                lr.getUpdatedAt(),
                lr.getUpdatedBy());
    }
}
