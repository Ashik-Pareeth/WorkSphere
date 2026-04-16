package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.GrievanceCategory;
import com.ucocs.worksphere.enums.GrievancePriority;
import com.ucocs.worksphere.enums.GrievanceStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class TicketResponse {

    private UUID id;
    private String ticketNumber;
    private GrievanceCategory category;
    private GrievancePriority priority;
    private String subject;
    private String description;
    private GrievanceStatus status;
    private String resolution;
    private String raisedByName;
    private UUID raisedById;
    private String assignedToName;
    private UUID assignedToId;
    private List<TicketCommentResponse> comments;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
    private LocalDateTime resolvedAt;
}
