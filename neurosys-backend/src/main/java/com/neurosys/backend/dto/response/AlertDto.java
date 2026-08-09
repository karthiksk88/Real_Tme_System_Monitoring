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
public class AlertDto {
    private String id;
    private String computerId;
    private String hostname;
    private String title;
    private String message;
    private String severity;
    private String alertType;
    private String status;
    private Double triggeredValue;
    private Double thresholdValue;
    private Instant triggeredAt;
    private Instant resolvedAt;
}
