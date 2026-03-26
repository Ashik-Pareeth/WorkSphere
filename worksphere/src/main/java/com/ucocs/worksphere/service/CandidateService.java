package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hiring.CandidateApplyRequest;
import com.ucocs.worksphere.entity.Candidate;
import com.ucocs.worksphere.entity.JobOpening;
import com.ucocs.worksphere.enums.CandidateSource;
import com.ucocs.worksphere.enums.CandidateStatus;
import com.ucocs.worksphere.enums.JobOpeningStatus;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.repository.CandidateRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.JobOpeningRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
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
    private final EmployeeRepository employeeRepository;   // ADDED
    private final NotificationService notificationService; // ADDED
    private final EmailService emailService;

    public List<Candidate> getCandidatesByJobId(UUID jobId) {
        return candidateRepository.findByJobOpeningId(jobId);
    }

    public Candidate getCandidateById(UUID id) {
        return candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));
    }

    @Transactional
    public Candidate applyForJob(CandidateApplyRequest request, MultipartFile file) {
        JobOpening jobOpening = jobOpeningRepository.findById(request.getJobOpeningId())
                .orElseThrow(() -> new RuntimeException("Job opening not found"));
        Candidate candidate = new Candidate();
        candidate.setJobOpening(jobOpening);
        candidate.setFullName(request.getFullName());
        candidate.setEmail(request.getEmail());
        candidate.setPhone(request.getPhone());
        candidate.setResumeUrl(request.getResumeUrl());
        candidate.setCoverNote(request.getCoverNote());

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

        candidate.setStatus(CandidateStatus.APPLIED);
        candidate.setSource(CandidateSource.PORTAL);
        Candidate saved = candidateRepository.save(candidate);

        // NOTIFICATION: Notify all HR/Admin employees that a new candidate has applied
        employeeRepository.findAll().stream()
                .filter(e -> e.getRoles().stream()
                        .anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN")))
                .forEach(hr -> notificationService.send(
                        hr.getId(),
                        NotificationType.CANDIDATE_APPLIED,
                        "New Candidate: " + saved.getFullName(),
                        saved.getFullName() + " has applied for the position \"" + jobOpening.getTitle() + "\". Review their profile in the hiring pipeline.",
                        saved.getId(),
                        "Candidate"
                ));

        return saved;
    }

    public Resource getCandidateResume(UUID id) {
        Candidate candidate = candidateRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Candidate not found"));

        if (candidate.getResumeFileUrl() == null) {
            throw new RuntimeException("No resume file found for this candidate");
        }

        try {
            Path filePath = Paths.get(candidate.getResumeFileUrl());
            Resource resource = new UrlResource(filePath.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("Resume file not found or unreadable");
            }
            return resource;
        } catch (MalformedURLException e) {
            throw new RuntimeException("Could not read resume file", e);
        }
    }

    @Transactional
    public Candidate updateStatus(UUID id, CandidateStatus newStatus, String rejectionReason) {
        Candidate candidate = getCandidateById(id);
        CandidateStatus oldStatus = candidate.getStatus();
        candidate.setStatus(newStatus);

        if (newStatus == CandidateStatus.REJECTED && rejectionReason != null) {
            candidate.setRejectionReason(rejectionReason);
        }

        if (newStatus == CandidateStatus.ACCEPTED) {
            JobOpening jobOpening = candidate.getJobOpening();
            if (jobOpening.getOpenSlots() > 0) {
                jobOpening.setOpenSlots(jobOpening.getOpenSlots() - 1);
            }
            if (jobOpening.getOpenSlots() == 0) {
                jobOpening.setStatus(JobOpeningStatus.CLOSED);
            }
            jobOpeningRepository.save(jobOpening);
        }

        Candidate saved = candidateRepository.save(candidate);

        // NOTIFICATION: Notify HR if a key status change happened (shortlisted, rejected, accepted)
        if (newStatus != oldStatus) {
            String statusLabel = newStatus.name().replace("_", " ");
            employeeRepository.findAll().stream()
                    .filter(e -> e.getRoles().stream()
                            .anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN")))
                    .forEach(hr -> notificationService.send(
                            hr.getId(),
                            NotificationType.CANDIDATE_STATUS_CHANGED,
                            "Candidate " + candidate.getFullName() + " → " + statusLabel,
                            "Candidate \"" + candidate.getFullName() + "\" for \"" + candidate.getJobOpening().getTitle() + "\" has been moved to status: " + statusLabel + (rejectionReason != null ? ". Reason: " + rejectionReason : "."),
                            saved.getId(),
                            "Candidate"
                    ));
            if (candidate.getEmail() != null) {
                emailService.sendCandidateStatusUpdateEmail(
                        candidate.getEmail(),
                        candidate.getFullName(),
                        candidate.getJobOpening().getTitle(),
                        statusLabel
                );
            }
        }

        return saved;
    }
}