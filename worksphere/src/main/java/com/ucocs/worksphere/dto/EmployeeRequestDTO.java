package com.ucocs.worksphere.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.util.UUID;

public record EmployeeRequestDTO(
        @NotBlank(message = "Username is required") String username,

        @NotBlank(message = "First name is required") String firstName,

        @NotBlank(message = "Last name is required") String lastName,

        @NotBlank(message = "Email is required") @Email(message = "Email should be valid") String email,

        @NotBlank(message = "Password is required") String password,

        @NotNull(message = "Salary is required") @Positive(message = "Salary must be positive") Double salary,

        UUID roleId,
        UUID Id,
        UUID jobPositionId) {
}
