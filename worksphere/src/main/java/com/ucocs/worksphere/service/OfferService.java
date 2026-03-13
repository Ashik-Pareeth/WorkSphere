package com.ucocs.worksphere.service;

import com.ucocs.worksphere.entity.OfferLetter;
import com.ucocs.worksphere.enums.OfferStatus;
import com.ucocs.worksphere.repository.OfferLetterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import com.ucocs.worksphere.entity.Candidate;
import com.ucocs.worksphere.enums.CandidateStatus;
import com.ucocs.worksphere.repository.CandidateRepository;
import com.ucocs.worksphere.util.JwtUtil;

@Service
@RequiredArgsConstructor
public class OfferService {
    private final OfferLetterRepository offerRepository;
    private final CandidateRepository candidateRepository;
    private final EmployeeService employeeService;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public OfferLetter getOfferForCandidate(UUID candidateId) {
        return offerRepository.findByCandidateId(candidateId);
    }

    public OfferLetter getOfferById(UUID offerId) {
        return offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
    }

    @Transactional
    public OfferLetter generateOffer(OfferLetter offer) {
        offer.setStatus(OfferStatus.SENT);
        offer.setSentAt(LocalDateTime.now());

        OfferLetter savedOffer = offerRepository.save(offer);

        // In a real system you'd email this link out:
        // /offers/{id}/respond?token={token}
        String generatedToken = jwtUtil.generateOfferToken(
                savedOffer.getCandidate().getEmail(),
                savedOffer.getId().toString());

        emailService.sendOfferEmail(
                savedOffer.getCandidate().getEmail(),
                savedOffer.getId().toString(),
                generatedToken
        );

        return savedOffer;
    }

    @Transactional
    public OfferLetter respondToOffer(UUID offerId, boolean accepted, String token) {
        OfferLetter offer = getOfferById(offerId);

        if (!jwtUtil.validateOfferToken(token, offer.getCandidate().getEmail(), offerId.toString())) {
            throw new RuntimeException("Invalid or expired offer token.");
        }

        offer.setStatus(accepted ? OfferStatus.ACCEPTED : OfferStatus.DECLINED);
        offer.setRespondedAt(LocalDateTime.now());
        offerRepository.save(offer);

        Candidate candidate = offer.getCandidate();
        candidate.setStatus(accepted ? CandidateStatus.ACCEPTED : CandidateStatus.DECLINED);

        if (accepted) {
            com.ucocs.worksphere.entity.Employee employee = employeeService.convertCandidateToEmployee(candidate,
                    offer);
            candidate.setConvertedEmployee(employee);
        }

        candidateRepository.save(candidate);

        return offer;
    }
}
