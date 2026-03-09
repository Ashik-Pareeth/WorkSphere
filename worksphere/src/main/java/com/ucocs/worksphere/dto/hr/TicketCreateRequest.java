package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.GrievanceCategory;
import com.ucocs.worksphere.enums.GrievancePriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketCreateRequest {

    @NotNull(message = "Category is required")
    private GrievanceCategory category;

    @NotNull(message = "Priority is required")
    private GrievancePriority priority;

    @NotBlank(message = "Subject is required")
    @Size(max = 200, message = "Subject must not exceed 200 characters")
    private String subject;

    @NotBlank(message = "Description is required")
    @Size(max = 5000, message = "Description must not exceed 5000 characters")
    private String description;
}
