package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.Department;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.Role;

import java.time.LocalDateTime;

public record EmployeeSummary(
        Long id,
        String userName,
        String firstName,
        String lastName,
        String email,
        double salary,
        String department,
        String role,
        String profilePic,
        LocalDateTime joiningDate
) {
    public static EmployeeSummary getEmployeeSummary(Employee employee) {
        return new EmployeeSummary(
                employee.getEmployeeId(),
                employee.getUserName(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getSalary(),
                employee.getDepartment() != null ? employee.getDepartment().getDepartmentName() : "No department assigned",
                employee.getRole() != null ? employee.getRole().getRoleName() : "No role",
                employee.getProfilePic(),
                employee.getJoiningDate());
    }
}
