package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    @Query("SELECT DISTINCT c FROM Candidate c " +
           "JOIN FETCH c.jobOpening j " +
           "JOIN FETCH j.department " +
           "JOIN FETCH j.jobPosition " +
           "LEFT JOIN FETCH c.convertedEmployee " +
           "WHERE j.id = :jobOpeningId")
    List<Candidate> findByJobOpeningId(@Param("jobOpeningId") UUID jobOpeningId);
    
    long countByJobOpeningId(UUID jobOpeningId);
    
    @Query("SELECT COUNT(c) FROM Candidate c WHERE c.jobOpening.id = :jobOpeningId AND c.status = 'INTERVIEWING'")
    long countInterviewsByJobOpeningId(@Param("jobOpeningId") UUID jobOpeningId);

    @Query("SELECT DISTINCT c FROM Candidate c " +
            "JOIN FETCH c.jobOpening j " +
            "JOIN FETCH j.department " +
            "JOIN FETCH j.jobPosition " +
            "LEFT JOIN FETCH c.convertedEmployee " +
            "WHERE j.id = :jobId")
    List<Candidate> findByJobOpeningIdWithDetails(@Param("jobId") UUID jobId);

    @Query("SELECT DISTINCT c FROM Candidate c " +
            "JOIN FETCH c.jobOpening j " +
            "JOIN FETCH j.department " +
            "JOIN FETCH j.jobPosition " +
            "LEFT JOIN FETCH c.convertedEmployee " +
            "WHERE c.id = :id")
    Optional<Candidate> findByIdWithDetails(@Param("id") UUID id);



}
