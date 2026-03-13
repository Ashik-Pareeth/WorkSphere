package com.ucocs.worksphere.dto.hiring;

import com.ucocs.worksphere.enums.CandidateSource;
import lombok.Data;

import java.util.UUID;

@Data
public class CandidateApplyRequest {
    private UUID jobOpeningId;
    private String fullName;
    private String email;
    private String phone;
    private String resumeUrl; // Handled via file upload separately or passed as string
    private String coverNote;
    private CandidateSource source;
}
