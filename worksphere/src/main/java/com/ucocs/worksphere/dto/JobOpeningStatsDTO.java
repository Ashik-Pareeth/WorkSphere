package com.ucocs.worksphere.dto;

import com.ucocs.worksphere.entity.JobOpening;
import lombok.Data;

@Data
public class JobOpeningStatsDTO {
    private JobOpening jobOpening;
    private long candidateCount;
    private long interviewCount;

    public JobOpeningStatsDTO(JobOpening jobOpening, long candidateCount, long interviewCount) {
        this.jobOpening = jobOpening;
        this.candidateCount = candidateCount;
        this.interviewCount = interviewCount;
    }
}
