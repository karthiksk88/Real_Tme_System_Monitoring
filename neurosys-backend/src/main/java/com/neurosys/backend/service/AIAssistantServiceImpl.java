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
                    .answer("✨ **Google Gemini API Key Configured Successfully!**\n\nGoogle Gemini 2.5 Flash is now active. I can now answer ANY question in ANY language and analyze your live computer fleet telemetry!")
                    .detectedIntent("GEMINI_KEY_CONFIGURED")
                    .optimizationRecommendations(List.of("Ask any question in your language", "Check fleet health status"))
                    .timestamp(Instant.now())
                    .build();
        }

        // 2. Route query to Google Gemini LLM with live context
        if (geminiAiClient.isConfigured()) {
            try {
                String liveContext = buildLiveContextSnapshot();
                String geminiAnswer = geminiAiClient.generateResponse(liveContext, rawMsg);
                if (geminiAnswer != null && !geminiAnswer.trim().isEmpty()) {
                    return ChatMessageResponse.builder()
                            .query(rawMsg)
                            .answer("✨ **Google Gemini AI:**\n\n" + geminiAnswer)
                            .detectedIntent("GEMINI_LLM_QUERY")
                            .optimizationRecommendations(List.of("Ask follow-up questions", "Check fleet computers"))
                            .timestamp(Instant.now())
                            .build();
                }
            } catch (Exception e) {
                log.error("Failed to query Gemini AI, falling back to rule engine", e);
            }
        }

        // 3. Smart Dynamic Rule Engine (when Gemini API is offline/unconfigured)
        String answer;
        String intent;
        List<String> recs = new ArrayList<>();

        if (msg.equals("hi") || msg.equals("hello") || msg.equals("hey") || msg.contains("namaste") || msg.contains("who are you") || msg.contains("your name")) {
            intent = "GREETING";
            answer = "Hello! I am NeuroSys AI Assistant Copilot.\n\n" +
                     "I can assist you with system monitoring, computer reports, network diagnostics, or general questions. Feel free to ask me anything!";
            recs.add("Ask for a computer report");
            recs.add("Check internet status across fleet");
        } else if (msg.contains("report") || msg.contains("computer") || msg.contains("pc") || msg.contains("laptop") || msg.contains("workstation")) {
            intent = "COMPUTER_REPORT_QUERY";
            String searchTarget = extractSearchTerm(msg);
            List<Computer> all = computerRepository.findAll();
            Computer matched = all.stream()
                    .filter(c -> (c.getHostname() != null && c.getHostname().toLowerCase().contains(searchTarget)) ||
                                 (c.getComputerName() != null && c.getComputerName().toLowerCase().contains(searchTarget)) ||
                                 (c.getIpAddress() != null && c.getIpAddress().contains(searchTarget)))
                    .findFirst().orElse(null);

            if (matched != null) {
                answer = String.format("""
                        📊 **System Diagnostic Report for %s (%s):**
                        • **Hostname:** %s
                        • **Computer Name:** %s
                        • **IP Address:** %s (MAC: %s)
                        • **Lab Assignment:** %s
                        • **Operating System:** %s (%s)
                        • **CPU Specs:** %s (%.0f MB RAM)
                        • **Status:** %s
                        • **Internet Access:** %s
                        • **Last Telemetry Signal:** %s
                        """,
                        matched.getHostname(),
                        matched.getComputerName() != null ? matched.getComputerName() : "N/A",
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
                recs.add("Inspect metrics for " + matched.getHostname());
            } else {
                StringBuilder sb = new StringBuilder();
                sb.append(String.format("🔍 No computer matching '**%s**' was found in the registered inventory.\n\n", searchTarget));
                sb.append("**Registered Fleet Endpoints:**\n");
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
        } else {
            intent = "GENERAL_DYNAMIC_QUERY";
            answer = String.format("I received your prompt: \"%s\"\n\n" +
                     "To activate full Google Gemini LLM reasoning for any question in any language (Kannada, Hindi, English, Spanish, etc.), ensure GEMINI_API_KEY is set in Railway environment variables!\n\n" +
                     "You can also ask about monitored computers (e.g., 'Report for LAB-01-PC01', 'Which computers have no internet?', 'Which computers don't have Java 21?').", rawMsg);
            recs.add("Check fleet computers report");
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
        String clean = msg.replace("give me", "")
                .replace("laptop report", "")
                .replace("computer report", "")
                .replace("report for", "")
                .replace("report", "")
                .replace("show", "")
                .replace("want", "")
                .replace("laptop", "")
                .replace("computer", "")
                .replace("pc", "")
                .trim();
        return clean.isEmpty() ? "pc" : clean;
    }

    private String buildLiveContextSnapshot() {
        List<Computer> computers = computerRepository.findAll();
        long distinctSwCount = softwareInventoryRepository.findDistinctSoftwareNames().size();

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("Total Monitored Endpoints: %d | Total Distinct Software Installed: %d\n", computers.size(), distinctSwCount));
        sb.append("Monitored Endpoints Snapshot:\n");

        for (Computer c : computers) {
            boolean isLive = c.getStatus() == ComputerStatus.ONLINE || c.getStatus() == ComputerStatus.WARNING || c.getStatus() == ComputerStatus.CRITICAL;
            boolean hasNet = isLive && Boolean.TRUE.equals(c.getInternetConnected());
            sb.append(String.format("- Hostname: %s | Computer Name: %s | Status: %s | Lab: %s | IP: %s | Internet: %s\n",
                    c.getHostname(),
                    c.getComputerName() != null ? c.getComputerName() : "N/A",
                    c.getStatus(),
                    c.getLabName(),
                    c.getIpAddress(),
                    hasNet ? "CONNECTED" : "DISCONNECTED / OFFLINE"));
        }

        return sb.toString();
    }
}
