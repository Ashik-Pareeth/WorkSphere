package com.ucocs.worksphere.repository;

import com.ucocs.worksphere.entity.OfferLetter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface OfferLetterRepository extends JpaRepository<OfferLetter, UUID> {
    OfferLetter findByCandidateId(UUID candidateId);
}
