package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.JobOpening;
import com.ucocs.worksphere.enums.JobOpeningStatus;
import com.ucocs.worksphere.repository.JobOpeningRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import com.ucocs.worksphere.repository.CandidateRepository;
import com.ucocs.worksphere.dto.JobOpeningStatsDTO;

@Service
@RequiredArgsConstructor
public class JobOpeningService {
    private final JobOpeningRepository jobOpeningRepository;
    private final CandidateRepository candidateRepository;

    public List<JobOpeningStatsDTO> getAllOpeningsWithStats() {
        return jobOpeningRepository.findAllWithDetails().stream().map(job -> {
            long candidateCount = candidateRepository.countByJobOpeningId(job.getId());
            long interviewCount = candidateRepository.countInterviewsByJobOpeningId(job.getId());
            return new JobOpeningStatsDTO(job, candidateCount, interviewCount);
        }).toList();
    }

    public List<JobOpening> getActiveOpenings() {
        return jobOpeningRepository.findByStatusWithDetails(JobOpeningStatus.OPEN);
    }

    public JobOpening getOpeningById(UUID id) {
        // Change findById to findByIdWithDetails
        return jobOpeningRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Job Opening not found"));
    }

    @Transactional
    public JobOpening createOpening(JobOpening opening) {
        return jobOpeningRepository.save(opening);
    }

    @Transactional
    public JobOpening updateStatus(UUID id, JobOpeningStatus status) {
        JobOpening opening = getOpeningById(id);
        opening.setStatus(status);
        return jobOpeningRepository.save(opening);
    }
}
