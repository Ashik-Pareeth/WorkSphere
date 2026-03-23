package com.ucocs.worksphere.dto.hiring;

import java.util.Map;

public record JobStatsResponse(
        int openJobs,
        int totalCandidates,
        Map<String, Integer> byStage,
        int avgTimeToHireDays
) {
}
