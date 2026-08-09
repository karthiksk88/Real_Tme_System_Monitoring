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
public class ChatMessageResponse {
    private String query;
    private String answer;
    private String detectedIntent;
    private List<String> optimizationRecommendations;
    @Builder.Default
    private Instant timestamp = Instant.now();
}
