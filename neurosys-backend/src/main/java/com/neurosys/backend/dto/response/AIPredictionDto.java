package com.neurosys.backend.dto.response;

import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIPredictionDto {
    private String computerId;
    private String hostname;
    private boolean isDataSufficient;     // False if insufficient history (< 10 samples)
    private String insufficientDataReason; // e.g. "Only 2 hours of historical data available."
    private String predictedIssue;        // Simple language e.g. "Storage may become full soon"
    private String estimatedTimeframe;    // e.g. "~7 days"
    private int confidencePercent;         // e.g. 91
    private String category;              // STORAGE, MEMORY, THERMAL, PERFORMANCE, GRAPHICS, STABILITY, NETWORK
    private String reason;                // Simple language explanation
    private String recommendedAction;     // Simple language action
    private Instant evaluatedAt;
}
