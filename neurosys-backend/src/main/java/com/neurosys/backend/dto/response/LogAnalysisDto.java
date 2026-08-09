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
public class LogAnalysisDto {
    private String id;
    private String computerId;
    private String hostname;
    private Integer eventId;
    private String providerName;
    private String logLevel;
    private String sourceComponent;
    private String rawMessage;
    private String simplifiedEnglish;
    private String suggestedSolution;
    private Instant timestamp;
}
