package com.neurosys.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrashPredictionResponse {
    private String id;
    private String computerId;
    private String hostname;
    private boolean isDataSufficient;
    private String insufficientDataReason;
    private String predictedIssue;
    private String estimatedTimeframe;
    private String riskLevel;
    private Double crashProbability;
    private Double confidenceScore;
    private Integer confidencePercent;
    private List<String> mainFactors;
    private List<String> reasons;
    private List<String> contributingFactors;
    private List<Map<String, Object>> historicalData;
    private List<Map<String, Object>> predictedData;
    private String recommendedAction;
    private String modelVersion;
    private Instant dataStartDate;
    private Instant dataEndDate;
    private Instant predictedAt;
}
