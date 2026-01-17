package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.Department;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Role;
import com.ucocs.worksphere.enums.EmployeeStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record EmployeeSummary(
        UUID id,
        String userName,
        String firstName,
        String lastName,
        String email,
        double salary,
        String department,
        String jobPosition,
        String profilePic,
        LocalDateTime joiningDate,
        EmployeeStatus status

) {
    public static EmployeeSummary getEmployeeSummary(Employee employee) {
        return new EmployeeSummary(
                employee.getId(),
                employee.getUserName(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getSalary(),
                employee.getDepartment() != null ? employee.getDepartment().getDepartmentName() : "No department assigned",
                employee.getJobPosition() != null ? employee.getJobPosition().getPositionName() : "No role",
                employee.getProfilePic(),
                employee.getJoiningDate(),
                employee.getEmployeeStatus());
    }
}
