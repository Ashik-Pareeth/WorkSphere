package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.entity.JobPosition;
import com.ucocs.worksphere.service.JobPositionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RequestMapping("/jobPositions")
@RestController
public class JobPositionController {
    private final JobPositionService jobPositionService;

    public JobPositionController(JobPositionService jobPositionService) {
        this.jobPositionService = jobPositionService;
    }

    @PostMapping
    public ResponseEntity<?> createJobPosition(@RequestBody JobPosition jobPosition) {
        jobPositionService.createJobPosition(jobPosition);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<JobPosition> getAllJobPositions() {
        return jobPositionService.findAllJobPosition();
    }
}

