package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.AssetCondition;
import com.ucocs.worksphere.enums.AssetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AssetCreateRequest {

    @NotNull(message = "Asset type is required")
    private AssetType type;

    @NotBlank(message = "Make/Model is required")
    private String makeModel;

    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    private LocalDate purchaseDate;

    private LocalDate warrantyExpiry;

    private AssetCondition condition;

    private String notes;
}
