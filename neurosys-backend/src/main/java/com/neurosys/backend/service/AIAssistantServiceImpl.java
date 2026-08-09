package com.neurosys.backend.service;

import com.neurosys.backend.dto.request.ChatMessageRequest;
import com.neurosys.backend.dto.response.ChatMessageResponse;
import com.neurosys.backend.dto.response.ComputerDto;
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

    @Override
    public ChatMessageResponse processUserQuery(ChatMessageRequest request) {
        String msg = request.getMessage().trim().toLowerCase();
        String answer;
        String intent;
        List<String> recs = new ArrayList<>();

        if (msg.contains("java") || (msg.contains("software") && msg.contains("missing"))) {
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
            if (!searchResult.getOutdatedComputers().isEmpty()) {
                sb.append("\n**Computers with outdated Java version:**\n");
                for (var o : searchResult.getOutdatedComputers()) {
                    sb.append(String.format("• **%s**: Version %s (Requires %s)\n", o.getHostname(), o.getCurrentVersion(), o.getRequiredVersion()));
                }
            }
            if (searchResult.getTotalMissing() == 0 && searchResult.getTotalOutdated() == 0) {
                sb.append("✓ All monitored computers have Java 21 installed and up to date!");
            }
            answer = sb.toString();
            recs.add("Deploy Java 21 JDK installer package to missing endpoints.");
            recs.add("Set JAVA_HOME system environment variable to Java 21 installation path.");
        } else if (msg.contains("internet") || msg.contains("no internet") || msg.contains("connectivity")) {
            intent = "INTERNET_CONNECTIVITY_QUERY";
            List<ComputerDto> all = contextService.getTopCpuComputers(); // get computers list
            List<ComputerDto> noInternet = all.stream().filter(c -> c.getInternetConnected() != null && !c.getInternetConnected()).toList();
            if (noInternet.isEmpty()) {
                answer = "🟢 All active monitored computers are connected to the Internet.";
            } else {
                StringBuilder sb = new StringBuilder("🔴 The following computers are online but have NO Internet connection:\n");
                for (ComputerDto c : noInternet) {
                    sb.append(String.format("• **%s** (%s) in %s\n", c.getHostname(), c.getIpAddress(), c.getLabName()));
                }
                answer = sb.toString();
                recs.add("Check gateway router and DNS configuration on target endpoints.");
                recs.add("Verify default gateway IP and subnet mask parameters.");
            }
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
                    sb.append(String.format("• **%s**: OFFLINE (Last seen %s)\n", c.getHostname(), c.getLastSeenAt()));
                }
                for (ComputerDto c : lowDisk) {
                    sb.append(String.format("• **%s**: Low Disk Space (%.1f%% used)\n", c.getHostname(), c.getCurrentDiskUsage()));
                }
                for (ComputerDto c : topCpu) {
                    sb.append(String.format("• **%s**: Sustained High CPU (%.1f%% utilization)\n", c.getHostname(), c.getCurrentCpuUsage()));
                }
                answer = sb.toString();
                recs.add("Review critical alerts in the Alerts tab.");
                recs.add("Execute system maintenance on affected endpoints.");
            }
        } else if (msg.contains("ready") || msg.contains("tomorrow") || msg.contains("lab")) {
            intent = "LAB_READINESS_QUERY";
            var readiness = softwareService.getLabReadiness("General Lab");
            StringBuilder sb = new StringBuilder();
            sb.append(String.format("**Lab Readiness Report for %s:**\n", readiness.getLabName()));
            sb.append(String.format("Status: %d / %d Computers Ready (%.0f%% Readiness)\n\n",
                    readiness.getReadyComputers(), readiness.getTotalComputers(), readiness.getReadinessPercentage()));

            if (readiness.getUnreadyComputers() > 0) {
                sb.append("**Computers needing setup before class:**\n");
                for (var c : readiness.getComputers()) {
                    if (!c.isReady()) {
                        sb.append(String.format("• **%s**: %s\n", c.getHostname(), String.join(", ", c.getIssues())));
                    }
                }
            } else {
                sb.append("✓ All computers in the lab meet software requirements and are ready for tomorrow's class!");
            }
            answer = sb.toString();
            recs.add("Check missing software packages under Software Inventory page.");
        } else if (msg.contains("offline")) {
            intent = "OFFLINE_COMPUTERS_QUERY";
            List<ComputerDto> offline = contextService.getOfflineComputers();
            if (offline.isEmpty()) {
                answer = "All registered computers are currently ONLINE and responding to monitoring heartbeats.";
            } else {
                StringBuilder sb = new StringBuilder("The following computers are currently OFFLINE:\n");
                for (ComputerDto c : offline) {
                    sb.append(String.format("• **%s** (%s) in %s - Last seen %s\n", c.getHostname(), c.getIpAddress(), c.getLabName(), c.getLastSeenAt()));
                }
                answer = sb.toString();
                recs.add("Verify network switch power and Ethernet cabling for listed endpoints.");
                recs.add("Restart the NeuroSys Agent background daemon service on target endpoints.");
            }
        } else if (msg.contains("cpu") || msg.contains("busy")) {
            intent = "HIGH_CPU_QUERY";
            List<ComputerDto> topCpu = contextService.getTopCpuComputers();
            StringBuilder sb = new StringBuilder("Top CPU resource consumers across the fleet:\n");
            for (ComputerDto c : topCpu) {
                sb.append(String.format("• **%s**: %.1f%% CPU Usage (Health Score: %.0f/100)\n", c.getHostname(), c.getCurrentCpuUsage(), c.getCurrentHealthScore()));
            }
            answer = sb.toString();
            recs.add("Inspect running process list for rogue background threads.");
            recs.add("Consider setting process priority limits or upgrading CPU capacity.");
        } else if (msg.contains("disk") || msg.contains("storage") || msg.contains("low disk")) {
            intent = "LOW_DISK_QUERY";
            List<ComputerDto> lowDisk = contextService.getLowDiskComputers();
            if (lowDisk.isEmpty()) {
                answer = "Disk space utilization is healthy across all monitored computers (>15% free space remaining).";
            } else {
                StringBuilder sb = new StringBuilder("Computers experiencing elevated disk capacity usage (>85%):\n");
                for (ComputerDto c : lowDisk) {
                    sb.append(String.format("• **%s**: %.1f%% Disk Space Used\n", c.getHostname(), c.getCurrentDiskUsage()));
                }
                answer = sb.toString();
                recs.add("Run File Analyzer on affected computers to purge temporary caches.");
            }
        } else if (msg.contains("slow") || msg.contains("pc-")) {
            intent = "COMPUTER_SLOWNESS_DIAGNOSIS";
            String computerName = extractComputerName(msg);
            ComputerDto computer = contextService.findComputerByNameOrId(computerName != null ? computerName : "pc-12");

            if (computer != null) {
                answer = String.format("""
                    **Slowness Diagnosis for %s:**
                    • **CPU Usage:** %.1f%%
                    • **RAM Allocation:** %.1f%%
                    • **Disk Space Used:** %.1f%%
                    • **Current Health Score:** %.0f / 100 (%s)
                    
                    **Root Cause:** Slowness is driven by resource consumption (RAM: %.1f%%, CPU: %.1f%%) and active background processes.
                    """,
                    computer.getHostname(),
                    computer.getCurrentCpuUsage(),
                    computer.getCurrentRamUsage(),
                    computer.getCurrentDiskUsage(),
                    computer.getCurrentHealthScore(),
                    computer.getStatus(),
                    computer.getCurrentRamUsage(),
                    computer.getCurrentCpuUsage()
                );
                recs.add("Open Process Manager tab and terminate top memory consumers.");
                recs.add("Purge Windows temp files to free virtual paging storage.");
            } else {
                answer = "Computer diagnostics summary: Target endpoint experiences high resource utilization. Recommend closing non-essential applications.";
                recs.add("Check process manager for rogue background tasks.");
            }
        } else if (msg.contains("error") || msg.contains("explain")) {
            intent = "ERROR_EXPLANATION";
            answer = "Recent critical event log error detected: **Event ID 7001 (Service Control Manager)**. " +
                     "Plain English Explanation: The Windows Service Control Manager failed to start a required background service during system boot.";
            recs.add("Open `services.msc`, locate dependent service (e.g. Netlogon), and set startup type to Automatic.");
            recs.add("Run `sfc /scannow` in administrative command prompt to repair corrupted Windows system files.");
        } else {
            intent = "GENERAL_AI_ASSISTANT_QUERY";
            answer = "Hello! I am NeuroSys AI Assistant Copilot. I monitor real-time telemetry and software readiness across all connected lab endpoints. You can ask me:\n" +
                     "• *'Which computers don't have Java 21?'*\n" +
                     "• *'Which computers have no internet?'*\n" +
                     "• *'Which computers need attention?'*\n" +
                     "• *'Are all computers ready for tomorrow's Java lab?'*\n" +
                     "• *'Why is PC-12 slow?'*";
            recs.add("Click any quick prompt chip below to query live telemetry.");
        }

        return ChatMessageResponse.builder()
                .query(request.getMessage())
                .answer(answer)
                .detectedIntent(intent)
                .optimizationRecommendations(recs)
                .timestamp(Instant.now())
                .build();
    }

    private String extractComputerName(String msg) {
        String[] words = msg.split("\\s+");
        for (String w : words) {
            if (w.startsWith("pc-") || w.startsWith("comp-") || w.startsWith("lab-")) {
                return w;
            }
        }
        return null;
    }
}
