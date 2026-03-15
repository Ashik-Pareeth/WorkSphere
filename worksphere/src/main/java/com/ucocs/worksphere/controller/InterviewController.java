package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hiring.InterviewScheduleDTO;
import com.ucocs.worksphere.entity.InterviewSchedule;
import com.ucocs.worksphere.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @GetMapping("/candidate/{candidateId}")
    @PreAuthorize("hasAnyRole('MANAGER', 'HR')")
    public ResponseEntity<List<InterviewScheduleDTO>> getInterviewsForCandidate(@PathVariable UUID candidateId) {
        return ResponseEntity.ok(interviewService.getInterviewsForCandidate(candidateId));
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<InterviewSchedule> scheduleInterview(@RequestBody InterviewSchedule schedule) {
        return ResponseEntity.ok(interviewService.scheduleInterview(schedule));
    }

    @PatchMapping("/{id}/feedback")
    @PreAuthorize("isAuthenticated()") // The service should technically verify the authenticated user is the assigned
                                       // interviewer
    public ResponseEntity<InterviewSchedule> submitFeedback(
            @PathVariable UUID id,
            @RequestParam Integer score,
            @RequestBody String feedback) {
        return ResponseEntity.ok(interviewService.submitFeedback(id, score, feedback));
    }
}
