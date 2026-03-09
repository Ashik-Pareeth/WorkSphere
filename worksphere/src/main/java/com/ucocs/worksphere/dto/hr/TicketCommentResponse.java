package com.ucocs.worksphere.dto.hr;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class TicketCommentResponse {

    private UUID id;
    private String content;
    private Boolean isInternal;
    private String authorName;
    private UUID authorId;
    private LocalDateTime createdAt;
}
