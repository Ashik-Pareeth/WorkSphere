package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.bulletin.AnnouncementRequest;
import com.ucocs.worksphere.dto.bulletin.BulletinPostDTO;
import com.ucocs.worksphere.dto.bulletin.ChatRequest;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.repository.EmployeeRepository;
import com.ucocs.worksphere.service.BulletinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/bulletin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class BulletinController {

    private final BulletinService bulletinService;
    private final EmployeeRepository employeeRepository;

    private Employee getAuthenticatedEmployee() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    @PostMapping("/announce")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR', 'AUDITOR')")
    public ResponseEntity<BulletinPostDTO> announce(
            @Valid @RequestBody AnnouncementRequest req
    ) {
        Employee user = getAuthenticatedEmployee();
        return ResponseEntity.ok(bulletinService.toDTO(bulletinService.createAnnouncement(user, req)));
    }

    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BulletinPostDTO> chat(
            @Valid @RequestBody ChatRequest req
    ) {
        Employee user = getAuthenticatedEmployee();
        return ResponseEntity.ok(bulletinService.toDTO(bulletinService.createChatMessage(user, req)));
    }

    @PatchMapping("/me/anonymous")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> setAnonymous(
            @RequestParam boolean enabled
    ) {
        Employee user = getAuthenticatedEmployee();
        bulletinService.setAnonymousPreference(user, enabled);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/feed")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<BulletinPostDTO>> getFeed(
            Pageable pageable
    ) {
        return ResponseEntity.ok(bulletinService.getFeed(pageable));
    }

    @PatchMapping("/{id}/pin")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'HR', 'AUDITOR')")
    public ResponseEntity<Void> togglePin(
            @PathVariable java.util.UUID id,
            @RequestParam boolean pinned
    ) {
        Employee user = getAuthenticatedEmployee();
        bulletinService.togglePin(id, pinned, user);
        return ResponseEntity.ok().build();
    }
}
