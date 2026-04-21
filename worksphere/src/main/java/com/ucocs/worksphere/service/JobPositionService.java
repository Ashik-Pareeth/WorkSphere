package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.JobPosition;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.JobPositionRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class JobPositionService {
    private final JobPositionRepository jobPositionRepository;

    public JobPositionService(JobPositionRepository jobPositionRepository) {
        this.jobPositionRepository = jobPositionRepository;
    }

    public JobPosition createJobPosition(JobPosition jobPosition) {
        return jobPositionRepository.save(jobPosition);
    }

    public List<JobPosition> findAllJobPosition() {
        return jobPositionRepository.findAll();
    }

    public JobPosition updateJobPosition(UUID id, JobPosition jobPositionDetails) {
        JobPosition jobPosition = jobPositionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job Position not found"));

        jobPosition.setPositionName(jobPositionDetails.getPositionName());
        return jobPositionRepository.save(jobPosition);
    }

    public void deleteJobPosition(UUID id) {
        JobPosition jobPosition = jobPositionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job Position not found"));
        jobPositionRepository.delete(jobPosition);
    }

}
