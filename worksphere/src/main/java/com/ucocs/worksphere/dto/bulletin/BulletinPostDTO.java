package com.ucocs.worksphere.dto.bulletin;

import com.ucocs.worksphere.enums.PostType;

import java.time.LocalDateTime;
import java.util.UUID;

public record BulletinPostDTO(
        UUID id,
        PostType type,
        String content,
        String authorDisplayName,
        boolean anonymous,
        boolean pinned,
        LocalDateTime createdAt
) {
}
