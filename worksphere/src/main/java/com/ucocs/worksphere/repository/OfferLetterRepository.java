package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.OfferLetter;
import org.jspecify.annotations.NullMarked;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@NullMarked
@Repository
public interface OfferLetterRepository extends JpaRepository<OfferLetter, UUID> {

    @EntityGraph(attributePaths = {"candidate", "jobOpening", "generatedBy"})
    OfferLetter findByCandidateId(UUID candidateId);

    @Override
    @EntityGraph(attributePaths = {"candidate", "jobOpening", "generatedBy"})
    Optional<OfferLetter> findById(UUID id);

    @Override
    @EntityGraph(attributePaths = {"candidate", "jobOpening", "generatedBy"})
    List<OfferLetter> findAll();
}