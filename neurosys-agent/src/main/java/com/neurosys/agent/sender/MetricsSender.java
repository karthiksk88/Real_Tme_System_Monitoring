package com.neurosys.agent.sender;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurosys.agent.config.AgentConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.File;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class MetricsSender {

    private static final Logger log = LoggerFactory.getLogger(MetricsSender.class);
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    private final OfflineCacheManager cacheManager;
    private String agentAuthToken;

    public MetricsSender() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
        this.cacheManager = new OfflineCacheManager();
    }

    public boolean registerWithServer(Map<String, Object> regData) {
        try {
            String jsonBody = objectMapper.writeValueAsString(regData);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(AgentConfig.getServerUrl() + "/agent/register"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                Map<String, Object> respMap = objectMapper.readValue(response.body(), Map.class);
                if (respMap.containsKey("data")) {
                    Map<String, Object> data = (Map<String, Object>) respMap.get("data");
                    this.agentAuthToken = (String) data.get("agentAuthToken");
                    String status = (String) data.get("status");
                    log.info("Agent registration response from server: AgentID={}, Status={}", regData.get("agentId"), status);
                    return true;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to register agent with server: {}. Retrying in next cycle...", e.getMessage());
        }
        return false;
    }

    public String checkApprovalStatus(String agentId) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(AgentConfig.getServerUrl() + "/agent/status/" + agentId))
                    .header("Content-Type", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                Map<String, Object> respMap = objectMapper.readValue(response.body(), Map.class);
                if (respMap.containsKey("data")) {
                    return (String) respMap.get("data");
                }
            }
        } catch (Exception e) {
            log.warn("Failed to check approval status from server: {}", e.getMessage());
        }
        return "PENDING";
    }

    public void sendMetricsPayload(Map<String, Object> payload) {
        try {
            // First flush any offline cached metric files
            flushOfflineCache();

            String jsonBody = objectMapper.writeValueAsString(payload);
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(AgentConfig.getServerUrl() + "/agent/metrics"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody));

            if (agentAuthToken != null) {
                builder.header("X-Agent-Token", agentAuthToken);
            }

            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                log.info("Successfully transmitted metrics payload to server. CPU: {}%, RAM: {}%",
                        payload.get("cpuUsagePercent"), payload.get("memoryUsagePercent"));
            } else {
                log.warn("Server returned HTTP error status: {}. Caching payload locally.", response.statusCode());
                cacheManager.cacheUnsentPayload(payload);
            }
        } catch (Exception e) {
            log.warn("Server unavailable ({}). Caching metrics payload on local disk.", e.getMessage());
            cacheManager.cacheUnsentPayload(payload);
        }
    }

    public void sendSoftwarePayload(String agentId, List<Map<String, String>> softwareList) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("agentId", agentId);
            payload.put("softwareList", softwareList);

            String jsonBody = objectMapper.writeValueAsString(payload);
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(AgentConfig.getServerUrl() + "/agent/software"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody));

            if (agentAuthToken != null) {
                builder.header("X-Agent-Token", agentAuthToken);
            }

            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                log.info("Successfully synced {} software inventory records with backend.", softwareList.size());
            } else {
                log.warn("Server returned HTTP status {} when syncing software inventory.", response.statusCode());
            }
        } catch (Exception e) {
            log.warn("Failed to sync software inventory with server: {}", e.getMessage());
        }
    }

    private void flushOfflineCache() {
        List<File> cachedFiles = cacheManager.getCachedFiles();
        if (!cachedFiles.isEmpty()) {
            log.info("Found {} cached metric payloads. Flushing up to 5 items to server...", cachedFiles.size());
            int count = 0;
            for (File file : cachedFiles) {
                if (count++ >= 5) break;
                try {
                    Map<String, Object> cachedData = cacheManager.readCachedFile(file);
                    String jsonBody = objectMapper.writeValueAsString(cachedData);

                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(AgentConfig.getServerUrl() + "/agent/metrics"))
                            .header("Content-Type", "application/json")
                            .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                            .build();

                    HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                    if (response.statusCode() == 200) {
                        cacheManager.deleteCachedFile(file);
                        log.info("Flushed cached metric file: {}", file.getName());
                    } else {
                        break;
                    }
                } catch (Exception e) {
                    log.error("Error flushing cached metric file {}", file.getName(), e);
                    break;
                }
            }
        }
    }
}
