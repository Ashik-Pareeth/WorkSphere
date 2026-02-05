package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.JobPosition;
import com.ucocs.worksphere.repository.JobPositionRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class JobPositionService {
    private final JobPositionRepository jobPositionRepository;

    public JobPositionService(JobPositionRepository jobPositionRepository) {
        this.jobPositionRepository = jobPositionRepository;
    }

    public void createJobPosition(JobPosition jobPosition) {
        jobPositionRepository.save(jobPosition);
    }

    public List<JobPosition> findAllJobPosition() {
        return jobPositionRepository.findAll();
    }
}


