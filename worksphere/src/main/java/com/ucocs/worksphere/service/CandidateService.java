package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hiring.CandidateApplyRequest;
import com.ucocs.worksphere.entity.Candidate;
import com.ucocs.worksphere.entity.JobOpening;
import com.ucocs.worksphere.enums.CandidateSource;
import com.ucocs.worksphere.enums.CandidateStatus;
import com.ucocs.worksphere.repository.CandidateRepository;
import com.ucocs.worksphere.repository.JobOpeningRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CandidateService {
    private final CandidateRepository candidateRepository;
    private final JobOpeningRepository jobOpeningRepository;

    public List<Candidate> getCandidatesByJobId(UUID jobId) {
        return candidateRepository.findByJobOpeningIdWithDetails(jobId);
    }

    public Candidate getCandidateById(UUID id) {
        return candidateRepository.findByIdWithDetails(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
    }

    @Transactional
    public Candidate applyForJob(CandidateApplyRequest request, MultipartFile file) {
        JobOpening jobOpening = jobOpeningRepository.findByIdWithDetails(request.getJobOpeningId())
                .orElseThrow(() -> new RuntimeException("Job opening not found"));
        Candidate candidate = new Candidate();
        candidate.setJobOpening(jobOpening);
        candidate.setFullName(request.getFullName());
        candidate.setEmail(request.getEmail());
        candidate.setPhone(request.getPhone());
        candidate.setResumeUrl(request.getResumeUrl());
        candidate.setCoverNote(request.getCoverNote());
        
        // Handle File Upload
        if (file != null && !file.isEmpty()) {
            String uploadDir = "uploads/resumes/";
            Path uploadPath = Paths.get(uploadDir);
            try {
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                String timeStamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
                String originalFilename = Paths.get(Objects.requireNonNull(file.getOriginalFilename())).getFileName().toString();
                String uniqueFileName = timeStamp + "_" + originalFilename;
                Path filePath = uploadPath.resolve(uniqueFileName);
                
                Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
                candidate.setResumeFileUrl(uploadDir + uniqueFileName);
            } catch (IOException e) {
                throw new RuntimeException("Failed to store resume file", e);
            }
        }

        // Defaults
        candidate.setStatus(CandidateStatus.APPLIED);
        candidate.setSource(CandidateSource.PORTAL);

        return candidateRepository.save(candidate);    
    }

    @Transactional
    public Candidate updateStatus(UUID id, CandidateStatus newStatus, String rejectionReason) {
        Candidate candidate = getCandidateById(id);
        candidate.setStatus(newStatus);
        if (newStatus == CandidateStatus.REJECTED && rejectionReason != null) {
            candidate.setRejectionReason(rejectionReason);
        }
        return candidateRepository.save(candidate);
    }
}
