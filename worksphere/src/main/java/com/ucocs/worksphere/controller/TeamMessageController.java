package com.ucocs.worksphere.controller;

import com.ucocs.worksphere.dto.bulletin.BulletinPostDTO;
import com.ucocs.worksphere.dto.bulletin.ChatRequest;
import com.ucocs.worksphere.entity.Employee;
import com.ucocs.worksphere.exception.ResourceNotFoundException;
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
@RequestMapping("/team/messages")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class TeamMessageController {

    private final BulletinService bulletinService;
    private final EmployeeRepository employeeRepository;

    private Employee getAuthenticatedEmployee() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return employeeRepository.findByUserName(username)
                .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found"));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BulletinPostDTO> postTeamMessage(
            @Valid @RequestBody ChatRequest req
    ) {
        Employee user = getAuthenticatedEmployee();
        return ResponseEntity.ok(bulletinService.toDTO(bulletinService.createTeamChatMessage(user, req)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<BulletinPostDTO>> getTeamFeed(
            Pageable pageable
    ) {
        Employee user = getAuthenticatedEmployee();
        return ResponseEntity.ok(bulletinService.getTeamFeed(user, pageable));
    }
}
