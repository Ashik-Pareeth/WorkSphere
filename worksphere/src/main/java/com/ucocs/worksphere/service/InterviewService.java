package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hiring.InterviewScheduleDTO;
import com.ucocs.worksphere.entity.InterviewSchedule;
import com.ucocs.worksphere.enums.InterviewStatus;
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
                .toList();    }

    @Transactional
    public InterviewSchedule scheduleInterview(InterviewSchedule interview) {
        return interviewRepository.save(interview);
    }

    @Transactional
    public InterviewSchedule submitFeedback(UUID interviewId, Integer score, String feedback) {
        InterviewSchedule interview = interviewRepository.findById(interviewId)
                .orElseThrow(() -> new RuntimeException("Interview not found"));

        interview.setScore(score);
        interview.setFeedback(feedback);
        interview.setStatus(InterviewStatus.COMPLETED);
        interview.setCompletedAt(LocalDateTime.now());

        return interviewRepository.save(interview);
    }
}
