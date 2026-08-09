package com.neurosys.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrashPredictionResponse {
    private String id;
    private String computerId;
    private String hostname;
    private String predictedIssue;
    private String estimatedTimeframe;
    private String riskLevel;
    private Double crashProbability;
    private Double confidenceScore;
    private List<String> mainFactors;
    private List<String> reasons;
    private String recommendedAction;
    private Instant predictedAt;
}
