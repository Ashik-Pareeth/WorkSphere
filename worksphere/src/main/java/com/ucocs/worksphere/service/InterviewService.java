package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hiring.InterviewScheduleDTO;
import com.ucocs.worksphere.entity.Candidate;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.InterviewSchedule;
import com.ucocs.worksphere.enums.InterviewStatus;
import com.ucocs.worksphere.enums.NotificationType;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
import com.ucocs.worksphere.repository.CandidateRepository;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.InterviewScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InterviewService {
    private final InterviewScheduleRepository interviewRepository;
    private final CandidateRepository candidateRepository;   // ADDED
    private final NotificationService notificationService;   // ADDED
    private final EmployeeRepository employeeRepository;
    private final EmailService emailService;


    public List<InterviewScheduleDTO> getInterviewsForCandidate(UUID candidateId) {
        return interviewRepository
                .findByCandidateId(candidateId)
                .stream()
                .map(i -> new InterviewScheduleDTO(
                        i.getId(),
                        i.getRoundNumber(),
                        i.getMode(),
                        i.getStatus().name(),
                        i.getScheduledAt(),
                        i.getInterviewer().getFirstName(),
                        i.getScore(),
                        i.getFeedback()
                ))
                .toList();
    }

    @Transactional
    public InterviewSchedule scheduleInterview(InterviewSchedule interview) {
        InterviewSchedule saved = interviewRepository.save(interview);

        Candidate candidate = null;
        if (saved.getCandidate() != null && saved.getCandidate().getId() != null) {
            candidate = candidateRepository.findById(saved.getCandidate().getId()).orElse(null);
        }
        
        Employee interviewer = null;
        if (saved.getInterviewer() != null && saved.getInterviewer().getId() != null) {
            interviewer = employeeRepository.findById(saved.getInterviewer().getId()).orElse(null);
        }

        // NOTIFICATION: Notify the interviewer (if they are an internal employee)
        if (interviewer != null) {
            notificationService.send(
                    interviewer.getId(),
                    NotificationType.INTERVIEW_SCHEDULED,
                    "Interview Scheduled: Round " + saved.getRoundNumber(),
                    "You have been assigned to interview candidate \"" + (candidate != null ? candidate.getFullName() : "Unknown") + "\" for Round " + saved.getRoundNumber() + " on " + saved.getScheduledAt() + " (" + saved.getMode() + ").",
                    saved.getId(),
                    "InterviewSchedule"
            );
        }

        if (candidate != null && candidate.getEmail() != null) {
            // Optional: Format the LocalDateTime to look nicer
            java.time.format.DateTimeFormatter dateFormatter = java.time.format.DateTimeFormatter.ofPattern("MMM dd, yyyy");
            java.time.format.DateTimeFormatter timeFormatter = java.time.format.DateTimeFormatter.ofPattern("hh:mm a");
            String formattedDate = saved.getScheduledAt().format(dateFormatter);
            String formattedTime = saved.getScheduledAt().format(timeFormatter);
            String interviewerName = interviewer != null ? interviewer.getFirstName() + " " + interviewer.getLastName() : "TBD";

            emailService.sendInterviewScheduledEmail(
                    candidate.getEmail(),
                    candidate.getFullName(),
                    candidate.getJobOpening().getTitle(),
                    formattedDate,
                    formattedTime,
                    saved.getMode().name(),
                    interviewerName,
                    saved.getRoundNumber()
            );
        }

        return saved;
    }

    @Transactional
    public InterviewSchedule submitFeedback(UUID interviewId, Integer score, String feedback) {
        InterviewSchedule interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Interview not found"));

        interview.setScore(score);
        interview.setFeedback(feedback);
        interview.setStatus(InterviewStatus.COMPLETED);
        interview.setCompletedAt(LocalDateTime.now());

        InterviewSchedule saved = interviewRepository.save(interview);


        employeeRepository.findAll().stream()
                .filter(e -> e.getRoles().stream()
                        .anyMatch(r -> r.getRoleName().endsWith("HR") || r.getRoleName().endsWith("ADMIN")))
                .forEach(hr -> notificationService.send(
                        hr.getId(),
                        NotificationType.INTERVIEW_FEEDBACK_SUBMITTED,
                        "Interview Feedback Submitted: " + interview.getCandidate().getFullName(),
                        "Feedback for candidate \"" + interview.getCandidate().getFullName() + "\" (Round " + interview.getRoundNumber() + ") has been submitted by " + interview.getInterviewer().getFirstName() + ". Score: " + score,
                        saved.getId(),
                        "InterviewSchedule"
                ));

        return saved;
    }
}
