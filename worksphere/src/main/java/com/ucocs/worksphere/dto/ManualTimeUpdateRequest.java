package com.ucocs.worksphere.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ManualTimeUpdateRequest {
    private LocalDateTime newClockIn;
    private LocalDateTime newClockOut;
    private String reason; // The mandatory justification
}