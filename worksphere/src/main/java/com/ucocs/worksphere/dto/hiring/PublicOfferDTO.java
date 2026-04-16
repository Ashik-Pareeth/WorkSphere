package com.ucocs.worksphere.dto.hiring;

import java.time.LocalDate;

public record PublicOfferDTO(
        String candidateName,
        String jobTitle,
        String departmentName,
        java.math.BigDecimal proposedSalary,
        LocalDate joiningDate
) {}