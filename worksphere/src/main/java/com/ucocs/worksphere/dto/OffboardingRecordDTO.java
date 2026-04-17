package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.OffboardingRecord;
import com.ucocs.worksphere.enums.OffboardingReason;
import com.ucocs.worksphere.enums.OffboardingStatus;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Builder
public record OffboardingRecordDTO(
        OffboardingReason reason,
        OffboardingStatus status,
        LocalDate lastWorkingDay,
        LocalDateTime initiatedAt,
        String remarks,
        Boolean itClearance,
        Boolean hrClearance,
        Boolean financeClearance
) {
    public static OffboardingRecordDTO fromEntity(OffboardingRecord ob) {
        if (ob == null) return null;
        return new OffboardingRecordDTO(
                ob.getReason(),
                ob.getStatus(),
                ob.getLastWorkingDay(),
                ob.getInitiatedAt(),
                ob.getRemarks(),
                ob.getItClearance(),
                ob.getHrClearance(),
                ob.getFinanceClearance()
        );
    }
}