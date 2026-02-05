package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.EmployeeStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record EmployeeResponseDTO(
        UUID id,

        String username,
        String firstName,
        String lastName,
        String email,

        double salary,

        String departmentName,
        String jobTitle,

        String profilePic,

        LocalDateTime joiningDate,

        EmployeeStatus employeeStatus

) {
    public static EmployeeResponseDTO fromEntity(Employee employee) {

        return new EmployeeResponseDTO(

                employee.getId(),

                employee.getUserName(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),

                employee.getSalary(),

                employee.getDepartment() != null
                        ? employee.getDepartment().getDepartmentName()
                        : null,

                employee.getJobPosition() != null
                        ? employee.getJobPosition().getPositionName()
                        : null,

                employee.getProfilePic(),

                employee.getJoiningDate(),

                employee.getEmployeeStatus()
        );
    }
}
