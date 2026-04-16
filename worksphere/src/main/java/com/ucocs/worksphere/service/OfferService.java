package com.ucocs.worksphere.service;

import com.ucocs.worksphere.dto.hiring.PublicOfferDTO;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.entity.OfferLetter;
import com.ucocs.worksphere.enums.OfferStatus;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.repository.OfferLetterRepository;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;
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
    private final EmployeeRepository employeeRepository;


    public OfferLetter getOfferForCandidate(UUID candidateId) {

        return offerRepository.findByCandidateId(candidateId);
    }

    public OfferLetter getOfferById(UUID offerId) {
        return offerRepository.findById(offerId)
                .orElseThrow(() -> new RuntimeException("Offer not found"));
    }

    @Transactional
    public OfferLetter generateOffer(OfferLetter offer) {

        Candidate candidate = candidateRepository.findById(
                offer.getCandidate().getId()
        ).orElseThrow(() -> new RuntimeException("Candidate not found"));

        offer.setCandidate(candidate);

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Employee generatedBy = employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("Authenticated employee not found"));
        offer.setGeneratedBy(generatedBy);

        offer.setStatus(OfferStatus.SENT);
        offer.setSentAt(LocalDateTime.now());

        OfferLetter savedOffer = offerRepository.save(offer);

        String email = candidate.getEmail();
        String generatedToken = jwtUtil.generateOfferToken(email, savedOffer.getId().toString());
        emailService.sendOfferEmail(email, savedOffer.getId().toString(), generatedToken);

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

    public PublicOfferDTO getPublicOfferById(UUID id, String token) {

        // Add this log before the findById call
        System.out.println("Looking for offer ID: " + id);
        // 1. Fetch offer from DB
        OfferLetter offer = offerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Offer not found"));

        try {
            // 2. Extract claims from token
            Claims claims = jwtUtil.extractAllClaims(token);

            String tokenEmail = claims.getSubject();
            String tokenOfferId = claims.get("offerId", String.class);
            String tokenType = claims.get("type", String.class);

            // 3. Validate token type
            if (!"OFFER_RESPONSE".equals(tokenType)) {
                throw new RuntimeException("Invalid token type");
            }

            // 4. Validate offerId match
            if (!id.toString().equals(tokenOfferId)) {
                throw new RuntimeException("Token does not match offer");
            }

            // 5. Validate email match (VERY IMPORTANT)
            String actualEmail = offer.getCandidate().getEmail();

            if (!actualEmail.equals(tokenEmail)) {
                throw new RuntimeException("Token does not belong to this candidate");
            }

            // 6. Validate expiry
            if (jwtUtil.extractExpiration(token).before(new Date())) {
                throw new RuntimeException("Token expired");
            }

            // ✅ All checks passed
            return new PublicOfferDTO(
                    offer.getCandidate().getFullName(),
                    offer.getJobOpening().getTitle(),
                    offer.getJobOpening().getDepartment().getName(),
                    offer.getProposedSalary() != null
                            ? offer.getProposedSalary()
                            : offer.getJobOpening().getSalaryMin(),                    offer.getJoiningDate()
            );
        } catch (Exception e) {
            throw new RuntimeException("Invalid or expired offer link");
        }
    }
}
