package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.LeaveBalance;
import java.util.UUID;

public record LeaveBalanceDTO(
        UUID id,
        Integer validForYear,
        Double daysAllocated,
        Double daysUsed,
        Double daysAvailable,
        EmployeeSummary employee,
        PolicySummary leavePolicy) {

    public record EmployeeSummary(UUID id, String firstName, String lastName) {
    }

    public record PolicySummary(UUID id, String name) {
    }

    public static LeaveBalanceDTO fromEntity(LeaveBalance lb) {
        return new LeaveBalanceDTO(
                lb.getId(),
                lb.getValidForYear(),
                lb.getDaysAllocated(),
                lb.getDaysUsed(),
                lb.getDaysAvailable(),
                lb.getEmployee() != null
                        ? new EmployeeSummary(lb.getEmployee().getId(), lb.getEmployee().getFirstName(),
                                lb.getEmployee().getLastName())
                        : null,
                lb.getLeavePolicy() != null
                        ? new PolicySummary(lb.getLeavePolicy().getId(), lb.getLeavePolicy().getName())
                        : null);
    }
}
