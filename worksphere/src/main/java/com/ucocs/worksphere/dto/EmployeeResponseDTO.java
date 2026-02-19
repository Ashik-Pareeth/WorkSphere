package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.enums.EmployeeStatus;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

public record EmployeeResponseDTO(
        UUID id,
        String username,
        String firstName,
        String lastName,
        String email,
        double salary,

        // ✅ ADDED: IDs for Editing
        UUID departmentId,
        UUID jobPositionId,

        // Existing Display Fields
        String departmentName,
        String jobTitle,

        // ✅ ADDED: Roles for Editing
        Set<SimpleRoleDTO> roles,

        String profilePic,
        LocalDateTime joiningDate,
        EmployeeStatus employeeStatus
) {
    // Simple record to hold Role data inside this DTO
    public record SimpleRoleDTO(UUID id, String roleName) {}

    public static EmployeeResponseDTO fromEntity(Employee employee) {
        return new EmployeeResponseDTO(
                employee.getId(),
                employee.getUserName(),
                employee.getFirstName(),
                employee.getLastName(),
                employee.getEmail(),
                employee.getSalary(),

                // Map IDs (Handle nulls)
                employee.getDepartment() != null ? employee.getDepartment().getId() : null,
                employee.getJobPosition() != null ? employee.getJobPosition().getId() : null,

                // Map Names
                employee.getDepartment() != null ? employee.getDepartment().getName() : null,
                employee.getJobPosition() != null ? employee.getJobPosition().getPositionName() : null,

                // Map Roles
                employee.getRoles() != null
                        ? employee.getRoles().stream()
                        .map(r -> new SimpleRoleDTO(r.getId(), r.getRoleName()))
                        .collect(Collectors.toSet())
                        : Set.of(),

                employee.getProfilePic(),
                employee.getJoiningDate(),
                employee.getEmployeeStatus()
        );
    }
}