package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.AssetCondition;
import com.ucocs.worksphere.enums.AssetType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class AssetResponse {

    private UUID id;
    private String assetTag;
    private AssetType type;
    private String makeModel;
    private String serialNumber;
    private AssetCondition condition;
    private LocalDate purchaseDate;
    private LocalDate warrantyExpiry;
    private String notes;
    private UUID assignedEmployeeId;
    private String assignedEmployeeName;
    private LocalDateTime assignedAt;
    private LocalDateTime createdAt;
    private String createdBy;
    private LocalDateTime updatedAt;
    private String updatedBy;
}
