package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Candidate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    List<Candidate> findByJobOpeningId(UUID jobOpeningId);
    
    long countByJobOpeningId(UUID jobOpeningId);
    
    @Query("SELECT COUNT(c) FROM Candidate c WHERE c.jobOpening.id = :jobOpeningId AND c.status = 'INTERVIEWING'")
    long countInterviewsByJobOpeningId(@Param("jobOpeningId") UUID jobOpeningId);
}
