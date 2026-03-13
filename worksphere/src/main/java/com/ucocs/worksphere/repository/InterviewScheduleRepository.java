package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.InterviewSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, UUID> {
    List<InterviewSchedule> findByCandidateId(UUID candidateId);

    List<InterviewSchedule> findByInterviewerId(UUID interviewerId);
}
