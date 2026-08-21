package com.neurosys.agent.command;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurosys.agent.config.AgentConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

public class PowerCommandHandler {

    private static final Logger log = LoggerFactory.getLogger(PowerCommandHandler.class);
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public PowerCommandHandler() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(3))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public void pollAndExecutePendingCommand() {
        try {
            long startTime = System.currentTimeMillis();
            String url = AgentConfig.getServerUrl() + "/agent/power-commands/pending?agentId=" + AgentConfig.getAgentId();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                String body = response.body().trim();
                if (body.startsWith("{")) {
                    Map<String, Object> respMap = objectMapper.readValue(body, Map.class);
                    if (respMap.containsKey("data") && respMap.get("data") != null) {
                        Map<String, Object> cmdData = (Map<String, Object>) respMap.get("data");
                        String commandId = (String) cmdData.get("id");
                        String commandType = (String) cmdData.get("commandType");

                        if (commandId != null && commandType != null) {
                            long elapsedMs = System.currentTimeMillis() - startTime;
                            log.info("[PERF LOG] [AGENT] Received command {} ({}) from backend in {}ms at {}", 
                                    commandId, commandType, elapsedMs, Instant.now());
                            executeCommand(commandId, commandType);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Quiet exception fallback during offline mode
        }
    }

    private void executeCommand(String commandId, String commandType) {
        // Step 1: Report EXECUTING status asynchronously (non-blocking)
        updateStatusAsync(commandId, "EXECUTING", null);

        try {
            String os = System.getProperty("os.name").toLowerCase();
            boolean isWindows = os.contains("win");
            long startExecMs = System.currentTimeMillis();

            ProcessBuilder pb;
            switch (commandType.toUpperCase()) {
                case "LOCK":
                    log.info("[PERF LOG] [AGENT] Executing LOCK workstation at {}", Instant.now());
                    if (isWindows) {
                        pb = new ProcessBuilder("rundll32.exe", "user32.dll,LockWorkStation");
                        pb.start();
                    } else {
                        log.warn("Lock workstation is supported natively on Windows systems.");
                    }
                    updateStatusAsync(commandId, "SUCCESS", null);
                    log.info("[PERF LOG] [AGENT] LOCK command process started in {}ms", System.currentTimeMillis() - startExecMs);
                    break;

                case "RESTART":
                    log.info("[PERF LOG] [AGENT] Executing RESTART command (Immediate /t 0) at {}", Instant.now());
                    if (isWindows) {
                        pb = new ProcessBuilder("shutdown.exe", "/r", "/t", "0", "/f", "/c", "Remote restart requested from NeuroSys Dashboard");
                        pb.start();
                    }
                    updateStatusAsync(commandId, "SUCCESS", null);
                    log.info("[PERF LOG] [AGENT] RESTART process launched in {}ms", System.currentTimeMillis() - startExecMs);
                    break;

                case "SHUTDOWN":
                    log.info("[PERF LOG] [AGENT] Executing SHUTDOWN command (Immediate /t 0) at {}", Instant.now());
                    if (isWindows) {
                        pb = new ProcessBuilder("shutdown.exe", "/s", "/t", "0", "/f", "/c", "Remote shutdown requested from NeuroSys Dashboard");
                        pb.start();
                    }
                    updateStatusAsync(commandId, "SUCCESS", null);
                    log.info("[PERF LOG] [AGENT] SHUTDOWN process launched in {}ms", System.currentTimeMillis() - startExecMs);
                    break;

                default:
                    log.warn("Unknown power command type: {}", commandType);
                    updateStatusAsync(commandId, "FAILED", "Unsupported command type: " + commandType);
                    break;
            }
        } catch (Exception e) {
            log.error("Failed to execute power command {}", commandType, e);
            updateStatusAsync(commandId, "FAILED", e.getMessage());
        }
    }

    private void updateStatusAsync(String commandId, String status, String failureReason) {
        CompletableFuture.runAsync(() -> {
            try {
                Map<String, Object> payload = new HashMap<>();
                payload.put("commandId", commandId);
                payload.put("agentId", AgentConfig.getAgentId());
                payload.put("status", status);
                if (failureReason != null) {
                    payload.put("failureReason", failureReason);
                }

                String jsonBody = objectMapper.writeValueAsString(payload);
                String url = AgentConfig.getServerUrl() + "/agent/power-commands/status";
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                        .build();

                httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                log.info("[PERF LOG] [AGENT] Reported command {} status: {}", commandId, status);
            } catch (Exception e) {
                log.error("Failed to report command status to server", e);
            }
        });
    }
}
