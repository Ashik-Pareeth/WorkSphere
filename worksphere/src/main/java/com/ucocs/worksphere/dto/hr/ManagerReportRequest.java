package com.ucocs.worksphere.dto.hr;

import java.util.UUID;

// ── Request sent by MANAGER to report / suggest an action on a team member ───
public record ManagerReportRequest(
        UUID employeeId,
        String suggestedAction,  // free text or action type hint
        String reason            // detailed description of the concern / suggestion
) {}