package com.ucocs.worksphere.dto;

import java.util.Set;
import java.util.UUID;

public record CreateEmployeeRequest(
        String username, // Matches frontend "username"
        String firstName,
        String lastName,
        String email,
        String password,
        double salary,
        UUID Id,       // Catches the ID
        UUID jobPositionId,      // Catches the UUID
        Set<UUID> roles          // Catches the list of role UUIDs
) {}