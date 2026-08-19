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
import java.util.HashMap;
import java.util.Map;

public class PowerCommandHandler {

    private static final Logger log = LoggerFactory.getLogger(PowerCommandHandler.class);
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public PowerCommandHandler() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public void pollAndExecutePendingCommand() {
        try {
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
                            log.info("Received remote power command: ID={}, Type={}", commandId, commandType);
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
        // Step 1: Report EXECUTING status
        updateStatus(commandId, "EXECUTING", null);

        try {
            String os = System.getProperty("os.name").toLowerCase();
            boolean isWindows = os.contains("win");

            ProcessBuilder pb;
            switch (commandType.toUpperCase()) {
                case "LOCK":
                    log.info("Executing LOCK workstation command...");
                    updateStatus(commandId, "SUCCESS", null);
                    if (isWindows) {
                        pb = new ProcessBuilder("rundll32.exe", "user32.dll,LockWorkStation");
                        pb.start();
                    } else {
                        log.warn("Lock workstation is supported natively on Windows systems.");
                    }
                    break;

                case "RESTART":
                    log.info("Executing RESTART command (5 second grace period)...");
                    updateStatus(commandId, "SUCCESS", null);
                    if (isWindows) {
                        pb = new ProcessBuilder("shutdown.exe", "/r", "/t", "5", "/f", "/c", "Remote restart requested from NeuroSys Dashboard");
                        pb.start();
                    }
                    break;

                case "SHUTDOWN":
                    log.info("Executing SHUTDOWN command (5 second grace period)...");
                    updateStatus(commandId, "SUCCESS", null);
                    if (isWindows) {
                        pb = new ProcessBuilder("shutdown.exe", "/s", "/t", "5", "/f", "/c", "Remote shutdown requested from NeuroSys Dashboard");
                        pb.start();
                    }
                    break;

                default:
                    log.warn("Unknown power command type: {}", commandType);
                    updateStatus(commandId, "FAILED", "Unsupported command type: " + commandType);
                    break;
            }
        } catch (Exception e) {
            log.error("Failed to execute power command {}", commandType, e);
            updateStatus(commandId, "FAILED", e.getMessage());
        }
    }

    private void updateStatus(String commandId, String status, String failureReason) {
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
            log.info("Reported command {} status: {}", commandId, status);
        } catch (Exception e) {
            log.error("Failed to report command status to server", e);
        }
    }
}
