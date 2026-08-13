package com.neurosys.backend.service;

import com.neurosys.backend.dto.request.ChatMessageRequest;
import com.neurosys.backend.dto.response.ChatMessageResponse;
import com.neurosys.backend.dto.response.ComputerDto;
import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.repository.ComputerRepository;
import com.neurosys.backend.repository.SoftwareInventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class AIAssistantServiceImpl implements AIAssistantService {

    private final SystemMonitoringContextService contextService;
    private final SoftwareService softwareService;
    private final GeminiAiClient geminiAiClient;
    private final ComputerRepository computerRepository;
    private final SoftwareInventoryRepository softwareInventoryRepository;

    @Override
    public ChatMessageResponse processUserQuery(ChatMessageRequest request) {
        String rawMsg = request.getMessage().trim();
        String msg = rawMsg.toLowerCase();

        // 1. Allow manual setting of Gemini API Key via prompt
        if (msg.startsWith("key:") || msg.startsWith("apikey:") || msg.startsWith("aizasy")) {
            String key = rawMsg.contains(":") ? rawMsg.substring(rawMsg.indexOf(":") + 1).trim() : rawMsg;
            geminiAiClient.setApiKey(key);
            return ChatMessageResponse.builder()
                    .query(rawMsg)
                    .answer("✨ **Google Gemini API Key Configured Successfully!**\n\nGoogle Gemini 2.5 Flash is now active. Ask me any complex IT monitoring question and I will analyze live computer telemetry using Gemini LLM reasoning!")
                    .detectedIntent("GEMINI_KEY_CONFIGURED")
                    .optimizationRecommendations(List.of("Which computers need attention right now?", "Summarize fleet health status"))
                    .timestamp(Instant.now())
                    .build();
        }

        // 2. Route query to Google Gemini LLM with live context
        if (geminiAiClient.isConfigured()) {
            try {
                String liveContext = buildLiveContextSnapshot();
                String geminiAnswer = geminiAiClient.generateResponse(liveContext, rawMsg);
                if (geminiAnswer != null && !geminiAnswer.trim().isEmpty() && !geminiAnswer.contains("Error calling Google Gemini API")) {
                    return ChatMessageResponse.builder()
                            .query(rawMsg)
                            .answer("✨ **Google Gemini AI Insight:**\n\n" + geminiAnswer)
                            .detectedIntent("GEMINI_LLM_QUERY")
                            .optimizationRecommendations(List.of("Ask about computer slowness", "Ask about software compliance"))
                            .timestamp(Instant.now())
                            .build();
                }
            } catch (Exception e) {
                log.error("Failed to query Gemini AI, falling back to rule engine", e);
            }
        }

        // 3. Fallback Rule Engine
        String answer;
        String intent;
        List<String> recs = new ArrayList<>();

        if (msg.equals("hi") || msg.equals("hello") || msg.equals("hey") || msg.contains("who are you") || msg.contains("your name")) {
            intent = "GREETING";
            answer = "Hello! I am NeuroSys AI Assistant Copilot.\n\n" +
                     "I monitor real-time telemetry and software readiness across all connected lab endpoints. Ask me about:\n" +
                     "• Computer status or specific endpoint reports (e.g. *'Report for LAB-01-PC01'*)\n" +
                     "• Missing software (e.g. *'Which computers don't have Java 21?'*)\n" +
                     "• Network connectivity (e.g. *'Which computers have no internet?'*)\n" +
                     "• Fleet issues (e.g. *'Which computers need attention?'*)";
            recs.add("Ask for a computer report");
            recs.add("Check internet status across fleet");
        } else if (msg.contains("report") || msg.contains("computer") || msg.contains("pc")) {
            intent = "COMPUTER_REPORT_QUERY";
            String searchTarget = extractSearchTerm(msg);
            List<Computer> all = computerRepository.findAll();
            Computer matched = all.stream()
                    .filter(c -> (c.getHostname() != null && c.getHostname().toLowerCase().contains(searchTarget)) ||
                                 (c.getComputerName() != null && c.getComputerName().toLowerCase().contains(searchTarget)) ||
                                 (c.getIpAddress() != null && c.getIpAddress().contains(searchTarget)))
                    .findFirst().orElse(null);

            if (matched != null) {
                ComputerDto dto = contextService.findComputerByNameOrId(matched.getHostname());
                answer = String.format("""
                        📊 **Detailed System Report for %s:**
                        • **Hostname:** %s
                        • **Computer Name:** %s
                        • **IP Address:** %s (MAC: %s)
                        • **Lab:** %s
                        • **Operating System:** %s (%s)
                        • **CPU Model:** %s
                        • **Total RAM:** %.0f MB
                        • **Status:** %s
                        • **Internet Access:** %s
                        • **Last Seen:** %s
                        """,
                        matched.getHostname(),
                        matched.getHostname(),
                        matched.getComputerName() != null ? matched.getComputerName() : "N/A",
                        matched.getIpAddress(),
                        matched.getMacAddress() != null ? matched.getMacAddress() : "N/A",
                        matched.getLabName() != null ? matched.getLabName() : "Default Lab",
                        matched.getOsName() != null ? matched.getOsName() : "Windows",
                        matched.getOsVersion() != null ? matched.getOsVersion() : "N/A",
                        matched.getCpuModel() != null ? matched.getCpuModel() : "N/A",
                        matched.getTotalRamMb() != null ? matched.getTotalRamMb() : 0.0,
                        matched.getStatus(),
                        Boolean.TRUE.equals(matched.getInternetConnected()) ? "🟢 CONNECTED" : "🔴 DISCONNECTED / OFFLINE",
                        matched.getLastSeenAt() != null ? matched.getLastSeenAt().toString() : "Never"
                );
                recs.add("Inspect running processes for " + matched.getHostname());
            } else {
                StringBuilder sb = new StringBuilder();
                sb.append(String.format("🔍 No computer matching '**%s**' was found in the monitored inventory.\n\n", searchTarget));
                sb.append("**Monitored Endpoints Currently Registered:**\n");
                for (Computer c : all) {
                    sb.append(String.format("• **%s** (%s) - %s in %s\n", c.getHostname(), c.getIpAddress(), c.getStatus(), c.getLabName()));
                }
                answer = sb.toString();
                recs.add("Try searching by hostname e.g. 'LAB-01-PC01'");
            }
        } else if (msg.contains("java") || (msg.contains("software") && msg.contains("missing"))) {
            intent = "SOFTWARE_JAVA_QUERY";
            var searchResult = softwareService.searchSoftware("Java", "21");
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("**Java 21 Availability Status across fleet:**\n"));
            sb.append(String.format("• Installed: %d computers\n", searchResult.getTotalInstalled()));
            sb.append(String.format("• Missing: %d computers\n", searchResult.getTotalMissing()));
            sb.append(String.format("• Outdated: %d computers\n\n", searchResult.getTotalOutdated()));

            if (!searchResult.getMissingComputers().isEmpty()) {
                sb.append("**Computers missing Java:**\n");
                for (var m : searchResult.getMissingComputers()) {
                    sb.append(String.format("• **%s** (%s)\n", m.getHostname(), m.getLabName()));
                }
            }
            answer = sb.toString();
            recs.add("Deploy Java 21 JDK installer package to missing endpoints.");
        } else if (msg.contains("internet") || msg.contains("no internet") || msg.contains("connectivity")) {
            intent = "INTERNET_CONNECTIVITY_QUERY";
            List<ComputerDto> all = contextService.getTopCpuComputers();
            List<ComputerDto> noInternet = all.stream().filter(c -> Boolean.FALSE.equals(c.getInternetConnected())).toList();
            List<ComputerDto> offline = contextService.getOfflineComputers();

            if (noInternet.isEmpty() && offline.isEmpty()) {
                answer = "🟢 All active monitored computers are connected to the Internet.";
            } else {
                StringBuilder sb = new StringBuilder();
                if (!noInternet.isEmpty()) {
                    sb.append("🔴 **Online computers with NO Internet Connection:**\n");
                    for (ComputerDto c : noInternet) {
                        sb.append(String.format("• **%s** (%s) in %s\n", c.getHostname(), c.getIpAddress(), c.getLabName()));
                    }
                }
                if (!offline.isEmpty()) {
                    if (sb.length() > 0) sb.append("\n");
                    sb.append("⚠️ **Offline / Disconnected computers (No active telemetry connection):**\n");
                    for (ComputerDto c : offline) {
                        sb.append(String.format("• **%s** (%s) in %s - Status: OFFLINE\n", c.getHostname(), c.getIpAddress(), c.getLabName()));
                    }
                }
                answer = sb.toString();
            }
            recs.add("Check gateway router and DNS configuration on target endpoints.");
        } else if (msg.contains("attention") || msg.contains("issues") || msg.contains("problem")) {
            intent = "COMPUTERS_NEEDING_ATTENTION_QUERY";
            List<ComputerDto> offline = contextService.getOfflineComputers();
            List<ComputerDto> lowDisk = contextService.getLowDiskComputers();
            List<ComputerDto> topCpu = contextService.getTopCpuComputers().stream().filter(c -> c.getCurrentCpuUsage() > 85.0).toList();

            if (offline.isEmpty() && lowDisk.isEmpty() && topCpu.isEmpty()) {
                answer = "✓ All monitored computers are healthy! No systems currently require immediate attention.";
            } else {
                StringBuilder sb = new StringBuilder("⚠️ **Computers that require attention:**\n");
                for (ComputerDto c : offline) {
                    sb.append(String.format("• **%s**: OFFLINE\n", c.getHostname()));
                }
                for (ComputerDto c : lowDisk) {
                    sb.append(String.format("• **%s**: Low Disk Space (%.1f%% used)\n", c.getHostname(), c.getCurrentDiskUsage()));
                }
                for (ComputerDto c : topCpu) {
                    sb.append(String.format("• **%s**: Sustained High CPU (%.1f%% utilization)\n", c.getHostname(), c.getCurrentCpuUsage()));
                }
                answer = sb.toString();
            }
            recs.add("Review critical alerts in the Alert Center.");
        } else {
            intent = "GENERAL_AI_ASSISTANT_QUERY";
            answer = "Hello! I am NeuroSys AI Assistant Copilot.\n\n" +
                     "I monitor real-time telemetry and software readiness across all connected lab endpoints. Ask me about:\n" +
                     "• *'Give me report for LAB-01-PC01'*\n" +
                     "• *'Which computers don't have Java 21?'*\n" +
                     "• *'Which computers have no internet?'*\n" +
                     "• *'Which computers need attention?'*";
            recs.add("Search for a computer report");
        }

        return ChatMessageResponse.builder()
                .query(rawMsg)
                .answer(answer)
                .detectedIntent(intent)
                .optimizationRecommendations(recs)
                .timestamp(Instant.now())
                .build();
    }

    private String extractSearchTerm(String msg) {
        String clean = msg.replace("give me", "").replace("computer report", "").replace("report for", "").replace("report", "").replace("show", "").trim();
        return clean.isEmpty() ? "pc" : clean;
    }

    private String buildLiveContextSnapshot() {
        List<Computer> computers = computerRepository.findAll();
        long distinctSwCount = softwareInventoryRepository.findDistinctSoftwareNames().size();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Total Endpoints: %d | Distinct Software Installed Fleetwide: %d\n", computers.size(), distinctSwCount));
        sb.append("Endpoints Telemetry Snapshot:\n");

        for (Computer c : computers) {
            boolean isLive = c.getStatus() == ComputerStatus.ONLINE || c.getStatus() == ComputerStatus.WARNING || c.getStatus() == ComputerStatus.CRITICAL;
            boolean hasNet = isLive && Boolean.TRUE.equals(c.getInternetConnected());
            sb.append(String.format("- Hostname: %s | Computer Name: %s | Status: %s | Lab: %s | IP: %s | Internet Access: %s\n",
                    c.getHostname(),
                    c.getComputerName() != null ? c.getComputerName() : "N/A",
                    c.getStatus(),
                    c.getLabName(),
                    c.getIpAddress(),
                    hasNet ? "YES (Connected)" : "NO (Disconnected / Offline)"));
        }

        return sb.toString();
    }
}
