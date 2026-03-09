package com.ucocs.worksphere.dto.hr;

import com.ucocs.worksphere.enums.AssetCondition;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AssetReturnRequest {

    @NotNull(message = "Condition on return is required")
    private AssetCondition condition;

    private String notes;
}
