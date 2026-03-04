package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.LeaveTransaction;
import java.util.UUID;

public record LeaveTransactionDTO(
        UUID id,
        String transactionType,
        Double daysChanged,
        String reason,
        String referenceRequestId,
        EmployeeSummary employee,
        PolicySummary leavePolicy) {

    public record EmployeeSummary(UUID id, String firstName, String lastName) {
    }

    public record PolicySummary(UUID id, String name) {
    }

    public static LeaveTransactionDTO fromEntity(LeaveTransaction lt) {
        return new LeaveTransactionDTO(
                lt.getId(),
                lt.getTransactionType() != null ? lt.getTransactionType().name() : null,
                lt.getDaysChanged(),
                lt.getReason(),
                lt.getReferenceRequestId(),
                lt.getEmployee() != null
                        ? new EmployeeSummary(lt.getEmployee().getId(), lt.getEmployee().getFirstName(),
                                lt.getEmployee().getLastName())
                        : null,
                lt.getLeavePolicy() != null
                        ? new PolicySummary(lt.getLeavePolicy().getId(), lt.getLeavePolicy().getName())
                        : null);
    }
}
