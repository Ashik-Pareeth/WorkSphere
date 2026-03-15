package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.InterviewSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, UUID> {
    @Query("SELECT DISTINCT inv FROM InterviewSchedule inv " +
           "LEFT JOIN FETCH inv.candidate " +
           "LEFT JOIN FETCH inv.interviewer " +
           "WHERE inv.candidate.id = :candidateId")
    List<InterviewSchedule> findByCandidateId(@Param("candidateId") UUID candidateId);

    @Query("SELECT DISTINCT inv FROM InterviewSchedule inv " +
           "LEFT JOIN FETCH inv.candidate " +
           "LEFT JOIN FETCH inv.interviewer " +
           "WHERE inv.interviewer.id = :interviewerId")
    List<InterviewSchedule> findByInterviewerId(@Param("interviewerId") UUID interviewerId);
}
