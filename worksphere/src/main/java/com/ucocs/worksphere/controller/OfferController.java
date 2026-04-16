package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.hiring.PublicOfferDTO;
import com.ucocs.worksphere.entity.OfferLetter;
import com.ucocs.worksphere.service.OfferService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/offers")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<OfferLetter> getOffer(@PathVariable UUID id) {
        return ResponseEntity.ok(offerService.getOfferById(id));
    }

    @GetMapping("/public/{id}")
    public ResponseEntity<PublicOfferDTO> getOfferByPublicId(@PathVariable UUID id, @RequestParam String token) {
        return ResponseEntity.ok(offerService.getPublicOfferById(id,token));
    }

    @PostMapping
    @PreAuthorize("hasRole('HR')")
    public ResponseEntity<OfferLetter> generateOffer(@RequestBody OfferLetter offer) {
        return ResponseEntity.ok(offerService.generateOffer(offer));
    }

    // THIS IS THE PUBLIC RESPOND ENDPOINT
    @PatchMapping("/{id}/respond")
    public ResponseEntity<OfferLetter> respondToOffer(
            @PathVariable UUID id,
            @RequestParam boolean accept,
            @RequestParam String token) {
        return ResponseEntity.ok(offerService.respondToOffer(id, accept, token));
    }
}
