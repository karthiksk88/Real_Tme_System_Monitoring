package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.AlertDto;
import com.neurosys.backend.dto.response.HealthScoreDto;
import com.neurosys.backend.dto.response.SystemMetricDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class WebSocketMetricsPublisher {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastTelemetryUpdate(SystemMetricDto metric, HealthScoreDto healthScore, List<AlertDto> newAlerts) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("metric", metric);
        payload.put("healthScore", healthScore);
        payload.put("newAlerts", newAlerts);

        // 1. Broadcast to specific computer channel
        String computerTopic = "/topic/metrics/" + metric.getComputerId();
        messagingTemplate.convertAndSend(computerTopic, payload);

        // 2. Broadcast to main Dashboard overview channel
        messagingTemplate.convertAndSend("/topic/dashboard", payload);

        // 3. Broadcast alerts if triggered
        if (newAlerts != null && !newAlerts.isEmpty()) {
            for (AlertDto alert : newAlerts) {
                messagingTemplate.convertAndSend("/topic/alerts", alert);
            }
        }
    }
}
