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
public class AgentRegistrationResponse {
    private String computerId;
    private String agentId;
    private String status;
    private String agentAuthToken;
    @Builder.Default
    private int collectionIntervalSeconds = 5;
    private Instant registeredAt;
}
