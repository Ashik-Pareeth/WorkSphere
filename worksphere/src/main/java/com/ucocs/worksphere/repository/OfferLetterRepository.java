package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.OfferLetter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OfferLetterRepository extends JpaRepository<OfferLetter, UUID> {
    @Query("SELECT DISTINCT ol FROM OfferLetter ol " +
           "LEFT JOIN FETCH ol.candidate " +
           "LEFT JOIN FETCH ol.jobOpening " +
           "LEFT JOIN FETCH ol.generatedBy " +
           "WHERE ol.candidate.id = :candidateId")
    Optional<OfferLetter> findByCandidateId(@Param("candidateId") UUID candidateId);
}
