package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hiring.JobOpeningRequest;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.JobOpening;
import com.ucocs.worksphere.enums.JobOpeningStatus;
import com.ucocs.worksphere.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import com.ucocs.worksphere.dto.JobOpeningStatsDTO;

@Service
@RequiredArgsConstructor
public class JobOpeningService {
    private final JobOpeningRepository jobOpeningRepository;
    private final CandidateRepository candidateRepository;
    private final DepartmentRepository departmentRepository;
    private final JobPositionRepository jobPositionRepository;
    private final EmployeeRepository employeeRepository;

    public List<JobOpeningStatsDTO> getAllOpeningsWithStats() {
        return jobOpeningRepository.findAll().stream().map(job -> {
            long candidateCount = candidateRepository.countByJobOpeningId(job.getId());
            long interviewCount = candidateRepository.countInterviewsByJobOpeningId(job.getId());
            return new JobOpeningStatsDTO(job, candidateCount, interviewCount);
        }).toList();
    }

    public List<JobOpening> getActiveOpenings() {
        return jobOpeningRepository.findByStatus(JobOpeningStatus.OPEN);
    }

    public JobOpening getOpeningById(UUID id) {
        return jobOpeningRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job Opening not found"));
    }

    @Transactional
    public JobOpening createOpening(JobOpeningRequest openingRequest,String hrUsername) {
        JobOpening jobOpening = new JobOpening();
        jobOpening.setTitle(openingRequest.getTitle());
        jobOpening.setDescription(openingRequest.getDescription());
        jobOpening.setClosingDate(openingRequest.getClosingDate());
        jobOpening.setSalaryMin(openingRequest.getSalaryMin());
        jobOpening.setSalaryMax(openingRequest.getSalaryMax());

        if (openingRequest.getOpenSlots() != null) {
            jobOpening.setOpenSlots(openingRequest.getOpenSlots());
        }

        jobOpening.setStatus(JobOpeningStatus.OPEN);

        jobOpening.setDepartment(departmentRepository.findById(openingRequest.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found")));

        jobOpening.setJobPosition(jobPositionRepository.findById(openingRequest.getJobPositionId())
                .orElseThrow(() -> new RuntimeException("Job Position not found")));

        Employee hrOwner = employeeRepository.findByUserName(hrUsername)
                .orElseThrow(() -> new RuntimeException("HR User not found"));
        jobOpening.setHrOwner(hrOwner);

        return jobOpeningRepository.save(jobOpening);
    }

    @Transactional
    public JobOpening updateStatus(UUID id, JobOpeningStatus status) {
        JobOpening opening = getOpeningById(id);
        opening.setStatus(status);
        return jobOpeningRepository.save(opening);
    }

    // Inside JobOpeningService.java

    // Inside JobOpeningService.java

    @Transactional
    public JobOpening updateOpenSlots(UUID id, Integer newSlots) {
        JobOpening opening = getOpeningById(id);
        opening.setOpenSlots(newSlots);

        // Automatically reopen the job if HR adds slots to a CLOSED job
        if (newSlots > 0 && opening.getStatus() == JobOpeningStatus.CLOSED) {
            opening.setStatus(JobOpeningStatus.OPEN);
        }
        // Automatically close the job if HR manually sets slots to 0 (and it isn't already closed/cancelled)
        else if (newSlots <= 0 && opening.getStatus() == JobOpeningStatus.OPEN) {
            opening.setStatus(JobOpeningStatus.CLOSED);
            opening.setOpenSlots(0); // Ensure it doesn't go negative
        }

        return jobOpeningRepository.save(opening);
    }

    public com.ucocs.worksphere.dto.hiring.JobStatsResponse getJobStats() {
        int openJobs = (int) jobOpeningRepository.countByStatus(JobOpeningStatus.OPEN);
        List<com.ucocs.worksphere.entity.Candidate> candidates = candidateRepository.findAll();
        int totalCandidates = candidates.size();

        java.util.Map<String, Integer> byStage = new java.util.LinkedHashMap<>();
        byStage.put("APPLIED", 0);
        byStage.put("SHORTLISTED", 0);
        byStage.put("INTERVIEWING", 0);
        byStage.put("OFFERED", 0);
        byStage.put("ACCEPTED", 0);

        for (com.ucocs.worksphere.entity.Candidate c : candidates) {
            if (c.getStatus() == null) continue;
            switch(c.getStatus()) {
                case APPLIED -> byStage.put("APPLIED", byStage.get("APPLIED") + 1);
                case SHORTLISTED -> byStage.put("SHORTLISTED", byStage.get("SHORTLISTED") + 1);
                case INTERVIEWING -> byStage.put("INTERVIEWING", byStage.get("INTERVIEWING") + 1);
                case OFFERED -> byStage.put("OFFERED", byStage.get("OFFERED") + 1);
                case ACCEPTED -> byStage.put("ACCEPTED", byStage.get("ACCEPTED") + 1);
                default -> {} // Ignore REJECTED and DECLINED as they fall out of funnel
            }
        }
        
        return new com.ucocs.worksphere.dto.hiring.JobStatsResponse(openJobs, totalCandidates, byStage, 0);
    }
}
