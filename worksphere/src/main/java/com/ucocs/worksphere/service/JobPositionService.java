package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.JobPosition;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.JobPositionRepository;
import com.ucocs.worksphere.repository.SalaryStructureRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class JobPositionService {
    private final JobPositionRepository jobPositionRepository;
    private final EmployeeRepository employeeRepository;
    private final SalaryStructureRepository salaryStructureRepository;

    public JobPositionService(JobPositionRepository jobPositionRepository,
                              EmployeeRepository employeeRepository,
                              SalaryStructureRepository salaryStructureRepository) {
        this.jobPositionRepository = jobPositionRepository;
        this.employeeRepository = employeeRepository;
        this.salaryStructureRepository = salaryStructureRepository;

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

    @Transactional
    public void deleteJobPosition(UUID id) {
        JobPosition jobPosition = jobPositionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Job Position not found"));
        if(employeeRepository.existsByJobPositionId(id))
        {
            throw new ResourceNotFoundException("Employee exist with this job title");
        }
        salaryStructureRepository.deleteByJobPositionId(id);
        jobPositionRepository.delete(jobPosition);
    }

}
