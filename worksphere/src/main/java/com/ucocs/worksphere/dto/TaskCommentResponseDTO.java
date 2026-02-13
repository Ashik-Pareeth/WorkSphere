package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.TaskComment;
import java.time.LocalDateTime;
import java.util.UUID;

public record TaskCommentResponseDTO(
        UUID id,
        String content,
        String authorName,
        LocalDateTime createdAt
) {
    public static TaskCommentResponseDTO fromEntity(TaskComment comment) {
        return new TaskCommentResponseDTO(
                comment.getId(),
                comment.getContent(),
                comment.getAuthor() != null ? comment.getAuthor().getUserName() : "Unknown",
                comment.getCreatedAt()
        );
    }
}