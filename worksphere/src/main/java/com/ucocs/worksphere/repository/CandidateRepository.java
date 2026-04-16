package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.Candidate;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
@Repository
public interface CandidateRepository extends JpaRepository<Candidate, UUID> {
    @EntityGraph(attributePaths = {"jobOpening", "jobOpening.jobPosition", "jobOpening.department", "convertedEmployee"})
    List<Candidate> findByJobOpeningId(UUID jobOpeningId);

    @Override
    @EntityGraph(attributePaths = {"jobOpening", "jobOpening.jobPosition", "jobOpening.department", "convertedEmployee"})
    Optional<Candidate> findById(UUID id);

    @Override
    @EntityGraph(attributePaths = {"jobOpening", "jobOpening.jobPosition", "jobOpening.department"})
    List<Candidate> findAll();

    long countByJobOpeningId(UUID jobOpeningId);

    @Query("SELECT COUNT(c) FROM Candidate c WHERE c.jobOpening.id = :jobOpeningId AND c.status = 'INTERVIEWING'")
    long countInterviewsByJobOpeningId(@Param("jobOpeningId") UUID jobOpeningId);
}
