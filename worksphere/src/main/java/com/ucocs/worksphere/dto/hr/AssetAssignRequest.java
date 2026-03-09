package com.ucocs.worksphere.dto.hr;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class AssetAssignRequest {

    @NotNull(message = "Employee ID is required")
    private UUID employeeId;

    private String notes;
}
