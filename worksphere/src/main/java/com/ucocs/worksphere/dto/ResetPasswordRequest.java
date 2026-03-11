package com.ucocs.worksphere.dto;

import jakarta.validation.constraints.NotBlank;

public record ResetPasswordRequest(
        @NotBlank(message = "Token is required") String token,

        @NotBlank(message = "New password is required") String newPassword) {
}
