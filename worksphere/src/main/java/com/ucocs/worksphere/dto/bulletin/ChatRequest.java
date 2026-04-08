package com.ucocs.worksphere.dto.bulletin;

import jakarta.validation.constraints.NotBlank;

public record ChatRequest(@NotBlank String content) {
}
