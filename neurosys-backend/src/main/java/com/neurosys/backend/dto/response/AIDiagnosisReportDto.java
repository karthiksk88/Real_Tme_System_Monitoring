package com.neurosys.backend.dto.response;

import lombok.*;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIDiagnosisReportDto {
    private String computerId;
    private String hostname;
    private String problemDetected;       // Simple language e.g. "Computer is running out of memory." or "No active problems"
    private String exactReason;           // Simple language e.g. "Available memory is dangerously low (less than 200 MB)."
    private List<String> evidence;         // Evidence bullet points
    private String solution;              // Practical solution for college lab admin
    private String confirmationStatus;    // CONFIRMED, LIKELY, NOT_CONFIRMED
    private List<PossibleCauseDto> possibleCauses; // For NOT_CONFIRMED ranking
    private Instant detectedAt;
    private boolean isProblemActive;
}
