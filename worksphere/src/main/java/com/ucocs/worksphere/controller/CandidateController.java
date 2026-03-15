package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hiring.CandidateApplyRequest;
import com.ucocs.worksphere.entity.Candidate;
import com.ucocs.worksphere.enums.CandidateStatus;
import com.ucocs.worksphere.service.CandidateService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/candidates")
@RequiredArgsConstructor
public class CandidateController {

    private final CandidateService candidateService;

    @GetMapping("/job/{jobId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    public ResponseEntity<List<Candidate>> getCandidatesByJob(@PathVariable UUID jobId) {
        return ResponseEntity.ok(candidateService.getCandidatesByJobId(jobId));
    }

    // THIS IS THE PUBLIC APPLY ENDPOINT - No PreAuthorize
    @PostMapping(value = "/public/apply", consumes = {"multipart/form-data"})
    public ResponseEntity<Candidate> applyForJob(
            @RequestPart("request") CandidateApplyRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ResponseEntity.ok(candidateService.applyForJob(request, file));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Candidate> updateCandidateStatus(
            @PathVariable UUID id,
            @RequestParam CandidateStatus status,
            @RequestParam(required = false) String rejectionReason) {
        return ResponseEntity.ok(candidateService.updateStatus(id, status, rejectionReason));
    }

    @GetMapping("/{id}/resume")
    public ResponseEntity<Resource> getResume(@PathVariable UUID id) {
        Resource resource = candidateService.getCandidateResume(id);
        String filename = resource.getFilename();
        String contentType = filename != null && filename.endsWith(".pdf")
                ? "application/pdf"
                : "application/octet-stream";

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
                .body(resource);
    }
}
