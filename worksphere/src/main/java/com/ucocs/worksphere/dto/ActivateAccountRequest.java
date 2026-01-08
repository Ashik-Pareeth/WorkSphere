package com.ucocs.worksphere.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ActivateAccountRequest(
        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 character")
        @Size(max = 32, message = "Password must be less that 32 character")
        String password,
        @NotBlank(message = "Phone number is required")
        String phoneNumber) {
}
