package com.neurosys.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HealthScoreDto {
    private String id;
    private String computerId;
    private String hostname;
    private Double overallScore;
    private Double cpuHealth;
    private Double memoryHealth;
    private Double diskHealth;
    private Double networkHealth;
    private String category;
    private Instant calculatedAt;
}
