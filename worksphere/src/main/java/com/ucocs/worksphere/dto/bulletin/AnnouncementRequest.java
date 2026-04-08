package com.ucocs.worksphere.dto.bulletin;

import jakarta.validation.constraints.NotBlank;

public record AnnouncementRequest(@NotBlank String content, boolean pinned) {
}
