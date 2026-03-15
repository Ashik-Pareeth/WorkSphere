package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.InterviewSchedule;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked@Repository
public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, UUID> {

    @EntityGraph(attributePaths = {
            "candidate",
            "candidate.jobOpening",
            "candidate.jobOpening.department",
            "interviewer"
    })
    List<InterviewSchedule> findByCandidateId(UUID candidateId);

    @EntityGraph(attributePaths = {
            "candidate",
            "candidate.jobOpening",
            "candidate.jobOpening.department",
            "interviewer"
    })
    List<InterviewSchedule> findByInterviewerId(UUID interviewerId);

    @Override
    @EntityGraph(attributePaths = {
            "candidate",
            "candidate.jobOpening",
            "candidate.jobOpening.department",
            "interviewer"
    })
    Optional<InterviewSchedule> findById(UUID id);

    @Override
    @EntityGraph(attributePaths = {
            "candidate",
            "candidate.jobOpening",
            "candidate.jobOpening.department",
            "interviewer"
    })
    List<InterviewSchedule> findAll();
}