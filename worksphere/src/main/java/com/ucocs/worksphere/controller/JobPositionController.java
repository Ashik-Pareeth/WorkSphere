package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.JobPosition;
import com.ucocs.worksphere.service.JobPositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RequestMapping("/jobPositions")
@RestController
public class JobPositionController {
    private final JobPositionService jobPositionService;

    public JobPositionController(JobPositionService jobPositionService) {
        this.jobPositionService = jobPositionService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN','HR')")
    public ResponseEntity<JobPosition> createJobPosition(@RequestBody JobPosition jobPosition) {
        JobPosition created = jobPositionService.createJobPosition(jobPosition);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<JobPosition> getAllJobPositions() {
        return jobPositionService.findAllJobPosition();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<JobPosition> updateJobPosition(@PathVariable UUID id, @RequestBody JobPosition jobPosition) {
        return ResponseEntity.ok(jobPositionService.updateJobPosition(id, jobPosition));
    }

    // ✅ ADD THIS: Delete Endpoint
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<Void> deleteJobPosition(@PathVariable UUID id) {
        jobPositionService.deleteJobPosition(id);
        return ResponseEntity.noContent().build();
    }


}


