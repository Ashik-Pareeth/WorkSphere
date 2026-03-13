package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.JobOpening;
import com.ucocs.worksphere.enums.JobOpeningStatus;
import com.ucocs.worksphere.dto.JobOpeningStatsDTO;
import com.ucocs.worksphere.service.JobOpeningService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobOpeningService jobOpeningService;

    @GetMapping
    @PreAuthorize("isAuthenticated()") // Internal view with stats
    public ResponseEntity<List<JobOpeningStatsDTO>> getAllJobs() {
        return ResponseEntity.ok(jobOpeningService.getAllOpeningsWithStats());
    }

    @GetMapping("/public")
    public ResponseEntity<List<JobOpening>> getActiveOpeningsPublic() {
        return ResponseEntity.ok(jobOpeningService.getActiveOpenings());
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<JobOpening> getOpeningByIdPublic(@PathVariable UUID id) {
        return ResponseEntity.ok(jobOpeningService.getOpeningById(id));
    }

    // Creating jobs requires HR or SUPER_ADMIN (Hierarchy handles ADMIN implicitly
    // if HR is used)
    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<JobOpening> createJob(@RequestBody JobOpening opening) {
        // In a real scenario, map DTO -> Entity and set createdBy
        return ResponseEntity.ok(jobOpeningService.createOpening(opening));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<JobOpening> updateStatus(
            @PathVariable UUID id,
            @RequestParam JobOpeningStatus status) {
        return ResponseEntity.ok(jobOpeningService.updateStatus(id, status));
    }
}
