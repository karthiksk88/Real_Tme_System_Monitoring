package com.neurosys.backend.dto.response;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AISystemHealthSummaryDto {
    private int totalComputers;
    private int healthyCount;
    private int needsAttentionCount;
    private int criticalCount;
    private int predictedRisksCount;
    private int criticalProblemsCount;
}
