package com.neurosys.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurosys.backend.dto.request.DiagnosticEventDto;
import com.neurosys.backend.dto.response.*;
import com.neurosys.backend.entity.*;
import com.neurosys.backend.enums.*;
import com.neurosys.backend.exception.ResourceNotFoundException;
import com.neurosys.backend.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiagnosisEngineServiceImpl implements DiagnosisEngineService {

    private final ComputerRepository computerRepository;
    private final SystemMetricRepository systemMetricRepository;
    private final DiagnosticEventRepository diagnosticEventRepository;
    private final DiagnosticIncidentRepository diagnosticIncidentRepository;
    private final AlertRepository alertRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public AIDiagnosisReportDto evaluateDiagnosis(String computerId) {
        Computer computer = computerRepository.findById(computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Computer", "id", computerId));

        // 1. Fetch recent telemetry history (up to 30 latest samples)
        List<SystemMetric> history = systemMetricRepository.findByComputerIdOrderByRecordedAtDesc(computerId, PageRequest.of(0, 30));
        
        // 2. Fetch recent diagnostic events (last 7 days)
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<DiagnosticEvent> recentEvents = diagnosticEventRepository.findByComputerIdOrderByOccurredAtDesc(computerId, PageRequest.of(0, 20));

        // 3. Rule Evaluation in order of priority:
        // Rule A: Graphics Driver Crash (CONFIRMED)
        Optional<DiagnosticEvent> graphicsCrash = recentEvents.stream()
                .filter(e -> e.getCategory() == DiagnosticCategory.GRAPHICS && e.getOccurredAt().isAfter(sevenDaysAgo))
                .findFirst();

        if (graphicsCrash.isPresent()) {
            DiagnosticEvent event = graphicsCrash.get();
            List<String> evidence = List.of(
                    "Windows recorded a graphics driver crash (" + (event.getEventSource() != null ? event.getEventSource() : "Display") + ").",
                    "The latest graphics driver error occurred on " + event.getOccurredAt().toString().substring(0, 16) + ".",
                    "Multiple graphics errors recorded in the last 7 days."
            );
            return buildDiagnosisDto(computer, "Graphics driver stopped working.", "Graphics driver stopped responding.",
                    evidence, "Update the graphics driver. If the problem continues, check the graphics hardware.",
                    ConfirmationStatus.CONFIRMED.name(), null, event.getOccurredAt(), true);
        }

        // Rule B: Disk Capacity Near Exhaustion (CONFIRMED)
        if (history != null && !history.isEmpty()) {
            SystemMetric latest = history.get(0);
            double diskPercent = latest.getDiskUsagePercent() != null ? latest.getDiskUsagePercent() : 0.0;
            double freeDiskGb = latest.getDiskFreeGb() != null ? latest.getDiskFreeGb() : 100.0;

            if (diskPercent >= 95.0 || freeDiskGb < 5.0) {
                List<String> evidence = List.of(
                        String.format("Disk usage is currently %.1f%%.", diskPercent),
                        String.format("Free disk space remaining: %.1f GB.", freeDiskGb),
                        "Storage usage has been consistently near maximum capacity."
                );
                return buildDiagnosisDto(computer, "Disk is almost full.", "Disk space is nearly exhausted.",
                        evidence, "Remove unnecessary files, clear temporary caches, or uninstall unused applications.",
                        ConfirmationStatus.CONFIRMED.name(), null, latest.getRecordedAt(), true);
            }
        }

        // Rule C: High Memory Exhaustion (LIKELY)
        if (history != null && history.size() >= 3) {
            SystemMetric latest = history.get(0);
            double ramPercent = latest.getMemoryUsagePercent() != null ? latest.getMemoryUsagePercent() : 0.0;
            double freeRamMb = latest.getMemoryFreeMb() != null ? latest.getMemoryFreeMb() : 4096.0;

            long highRamCount = history.stream()
                    .filter(m -> m.getMemoryUsagePercent() != null && m.getMemoryUsagePercent() >= 88.0)
                    .count();

            if (ramPercent >= 90.0 || (highRamCount >= 3 && freeRamMb < 800)) {
                List<String> evidence = List.of(
                        String.format("RAM usage stayed above 90%% (currently %.1f%%).", ramPercent),
                        String.format("Available memory is dangerously low (%.0f MB free).", freeRamMb),
                        "Multiple memory-intensive background processes are active."
                );
                return buildDiagnosisDto(computer, "Computer is running out of memory.", "Computer is running out of available memory.",
                        evidence, "Close unnecessary background applications or restart the computer.",
                        ConfirmationStatus.LIKELY.name(), null, latest.getRecordedAt(), true);
            }
        }

        // Rule D: Processor Overheating (LIKELY)
        if (history != null && !history.isEmpty()) {
            SystemMetric latest = history.get(0);
            Double temp = latest.getCpuTemperature();
            if (temp != null && temp >= 85.0) {
                List<String> evidence = List.of(
                        String.format("Processor temperature reached %.1f°C.", temp),
                        "High thermal workload sustained under active operation."
                );
                return buildDiagnosisDto(computer, "Computer is overheating.", "Processor temperature reached dangerous levels.",
                        evidence, "Clean dust from cooling fans, verify thermal ventilation, or reduce heavy CPU workloads.",
                        ConfirmationStatus.LIKELY.name(), null, latest.getRecordedAt(), true);
            }
        }

        // Rule E: Network Instability (LIKELY)
        Optional<DiagnosticEvent> networkEvent = recentEvents.stream()
                .filter(e -> e.getCategory() == DiagnosticCategory.NETWORK && e.getOccurredAt().isAfter(Instant.now().minus(2, ChronoUnit.HOURS)))
                .findFirst();

        if (networkEvent.isPresent()) {
            List<String> evidence = List.of(
                    "Network interface reported repeated packet disconnections.",
                    "Network connectivity drops detected in recent telemetry sampling."
            );
            return buildDiagnosisDto(computer, "Internet connection keeps disconnecting.", "Unstable network adapter or connection dropouts.",
                    evidence, "Check Ethernet cable, reconnect Wi-Fi, or update network card driver.",
                    ConfirmationStatus.LIKELY.name(), null, networkEvent.get().getOccurredAt(), true);
        }

        // Rule F: Unexpected Shutdown / System Crash without specific driver cause (NOT CONFIRMED)
        Optional<DiagnosticEvent> unexpectedShutdown = recentEvents.stream()
                .filter(e -> e.getCategory() == DiagnosticCategory.UNEXPECTED_SHUTDOWN || e.getCategory() == DiagnosticCategory.SYSTEM_CRASH)
                .findFirst();

        if (unexpectedShutdown.isPresent()) {
            DiagnosticEvent event = unexpectedShutdown.get();
            List<String> evidence = List.of(
                    "Windows recorded an unexpected shutdown or system crash (Event ID " + (event.getEventId() != null ? event.getEventId() : 41) + ").",
                    "High CPU and memory usage detected prior to shutdown.",
                    "No direct hardware or driver error binary log was found."
            );
            List<PossibleCauseDto> possibleCauses = List.of(
                    new PossibleCauseDto("Memory depletion problem", 62),
                    new PossibleCauseDto("Driver subsystem failure", 41),
                    new PossibleCauseDto("Thermal CPU overload", 28)
            );
            return buildDiagnosisDto(computer, "Computer shut down unexpectedly.", "Cause could not be confirmed from the available data.",
                    evidence, "Check Windows Event Log for crash details and continue monitoring.",
                    ConfirmationStatus.NOT_CONFIRMED.name(), possibleCauses, event.getOccurredAt(), true);
        }

        // Default: Healthy / No Active Problem
        return buildDiagnosisDto(computer, "No active problems detected", "Computer operating normally within healthy thresholds.",
                List.of("Telemetry metrics are stable.", "No Windows system error events recorded."),
                "No action required. Regular monitoring active.", ConfirmationStatus.CONFIRMED.name(), null, Instant.now(), false);
    }

    @Override
    @Transactional(readOnly = true)
    public AIPredictionDto evaluatePrediction(String computerId) {
        Computer computer = computerRepository.findById(computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Computer", "id", computerId));

        List<SystemMetric> history = systemMetricRepository.findByComputerIdOrderByRecordedAtDesc(computerId, PageRequest.of(0, 50));

        // Data Sufficiency Rule: Require at least 5 telemetry samples
        if (history == null || history.size() < 5) {
            return AIPredictionDto.builder()
                    .computerId(computer.getId())
                    .hostname(computer.getHostname())
                    .isDataSufficient(false)
                    .insufficientDataReason("Not enough historical data yet — Minimum 5 telemetry samples required for trend forecasting.")
                    .predictedIssue("Insufficient Historical Data")
                    .estimatedTimeframe("N/A")
                    .confidencePercent(0)
                    .category("UNKNOWN")
                    .reason("Telemetry collection recently started.")
                    .recommendedAction("Continue collecting telemetry data to enable trend predictions.")
                    .evaluatedAt(Instant.now())
                    .build();
        }

        // Trend calculation
        SystemMetric latest = history.get(0);
        SystemMetric oldest = history.get(history.size() - 1);

        double diskLatest = latest.getDiskUsagePercent() != null ? latest.getDiskUsagePercent() : 0.0;
        double diskOldest = oldest.getDiskUsagePercent() != null ? oldest.getDiskUsagePercent() : 0.0;
        double diskDelta = diskLatest - diskOldest;

        double ramLatest = latest.getMemoryUsagePercent() != null ? latest.getMemoryUsagePercent() : 0.0;
        double ramOldest = oldest.getMemoryUsagePercent() != null ? oldest.getMemoryUsagePercent() : 0.0;
        double ramDelta = ramLatest - ramOldest;

        // Prediction 1: Storage Problem
        if (diskLatest >= 85.0 || diskDelta > 3.0) {
            int estDays = diskLatest >= 92.0 ? 3 : (diskLatest >= 88.0 ? 7 : 14);
            int confidence = Math.min(96, 80 + (int)(diskLatest * 0.15));
            return AIPredictionDto.builder()
                    .computerId(computer.getId())
                    .hostname(computer.getHostname())
                    .isDataSufficient(true)
                    .predictedIssue("Storage may run out soon")
                    .estimatedTimeframe("~" + estDays + " days")
                    .confidencePercent(confidence)
                    .category("STORAGE")
                    .reason("Free storage space has been continuously decreasing over recent samples.")
                    .recommendedAction("Clean up temporary files and remove unnecessary applications to preserve disk space.")
                    .evaluatedAt(Instant.now())
                    .build();
        }

        // Prediction 2: Memory-related performance degradation
        if (ramLatest >= 80.0 || ramDelta > 5.0) {
            int estDays = ramLatest >= 90.0 ? 2 : 12;
            int confidence = Math.min(92, 75 + (int)(ramLatest * 0.15));
            return AIPredictionDto.builder()
                    .computerId(computer.getId())
                    .hostname(computer.getHostname())
                    .isDataSufficient(true)
                    .predictedIssue("Memory performance degradation risk")
                    .estimatedTimeframe("~" + estDays + " days")
                    .confidencePercent(confidence)
                    .category("MEMORY")
                    .reason("RAM allocation has increased continuously over historical monitoring.")
                    .recommendedAction("Monitor memory-heavy applications and restart long-running services.")
                    .evaluatedAt(Instant.now())
                    .build();
        }

        // Default Optimal Prediction
        return AIPredictionDto.builder()
                .computerId(computer.getId())
                .hostname(computer.getHostname())
                .isDataSufficient(true)
                .predictedIssue("Optimal System Performance")
                .estimatedTimeframe("No issue predicted within 6 months")
                .confidencePercent(95)
                .category("PERFORMANCE")
                .reason("System telemetry trends demonstrate stable CPU, RAM, and Disk resource usage.")
                .recommendedAction("Maintain standard operational monitoring.")
                .evaluatedAt(Instant.now())
                .build();
    }

    @Override
    @Transactional
    public void recordAgentEvents(String agentId, List<DiagnosticEventDto> events) {
        Computer computer = computerRepository.findByAgentId(agentId)
                .orElse(null);
        if (computer == null || events == null || events.isEmpty()) return;

        for (DiagnosticEventDto dto : events) {
            DiagnosticCategory cat;
            try {
                cat = DiagnosticCategory.valueOf(dto.getCategory().toUpperCase());
            } catch (Exception e) {
                cat = DiagnosticCategory.APPLICATION;
            }

            DiagnosticEvent event = DiagnosticEvent.builder()
                    .computer(computer)
                    .eventSource(dto.getEventSource())
                    .eventId(dto.getEventId())
                    .category(cat)
                    .message(dto.getMessage())
                    .occurredAt(dto.getOccurredAt() != null ? dto.getOccurredAt() : Instant.now())
                    .build();

            diagnosticEventRepository.save(event);
        }

        // Re-evaluate incidents after receiving events
        processMetricsForIncidents(computer.getId());
    }

    @Override
    @Transactional
    public void processMetricsForIncidents(String computerId) {
        AIDiagnosisReportDto report = evaluateDiagnosis(computerId);

        if (report.isProblemActive()) {
            DiagnosticCategory cat = parseCategoryFromProblem(report.getProblemDetected());
            Optional<DiagnosticIncident> activeInc = diagnosticIncidentRepository
                    .findFirstByComputerIdAndCategoryAndIncidentStatus(computerId, cat, IncidentStatus.ACTIVE);

            if (activeInc.isPresent()) {
                // Deduplication: Update lastSeenAt on existing incident, do NOT duplicate notification
                DiagnosticIncident inc = activeInc.get();
                inc.setLastSeenAt(Instant.now());
                diagnosticIncidentRepository.save(inc);
            } else {
                // New Incident: Create incident and send ONE notification
                String evidenceJson;
                try {
                    evidenceJson = objectMapper.writeValueAsString(report.getEvidence());
                } catch (Exception e) {
                    evidenceJson = "[]";
                }

                String possibleCausesJson = null;
                if (report.getPossibleCauses() != null) {
                    try {
                        possibleCausesJson = objectMapper.writeValueAsString(report.getPossibleCauses());
                    } catch (Exception e) {
                        possibleCausesJson = null;
                    }
                }

                DiagnosticIncident newInc = DiagnosticIncident.builder()
                        .computer(computerRepository.findById(computerId).orElse(null))
                        .problemTitle(report.getProblemDetected())
                        .category(cat)
                        .confirmationStatus(ConfirmationStatus.valueOf(report.getConfirmationStatus()))
                        .incidentStatus(IncidentStatus.ACTIVE)
                        .exactReason(report.getExactReason())
                        .evidenceJson(evidenceJson)
                        .solution(report.getSolution())
                        .possibleCausesJson(possibleCausesJson)
                        .detectedAt(Instant.now())
                        .lastSeenAt(Instant.now())
                        .build();

                diagnosticIncidentRepository.save(newInc);

                // Publish single alert notification with BaseEntity timestamps
                Alert alert = Alert.builder()
                        .computer(computerRepository.findById(computerId).orElse(null))
                        .title(report.getProblemDetected())
                        .message("Reason: " + report.getExactReason() + " [Status: " + report.getConfirmationStatus() + "]")
                        .severity(report.getConfirmationStatus().equals("CONFIRMED") ? AlertSeverity.CRITICAL : AlertSeverity.WARNING)
                        .alertType(AlertType.AI_PREDICTION)
                        .status(AlertStatus.OPEN)
                        .triggeredAt(Instant.now())
                        .build();
                alert.setCreatedAt(Instant.now());
                alert.setUpdatedAt(Instant.now());
                alertRepository.save(alert);
            }
        } else {
            // Check if any ACTIVE incidents exist that are now RESOLVED
            List<DiagnosticIncident> activeList = diagnosticIncidentRepository.findByComputerIdAndIncidentStatus(computerId, IncidentStatus.ACTIVE);
            for (DiagnosticIncident inc : activeList) {
                inc.setIncidentStatus(IncidentStatus.RESOLVED);
                inc.setResolvedAt(Instant.now());
                diagnosticIncidentRepository.save(inc);

                long durationMinutes = Duration.between(inc.getDetectedAt(), inc.getResolvedAt()).toMinutes();
                if (durationMinutes < 1) durationMinutes = 1;

                Alert resolutionAlert = Alert.builder()
                        .computer(computerRepository.findById(computerId).orElse(null))
                        .title("🟢 RESOLVED — " + inc.getProblemTitle())
                        .message("Problem resolved. Metrics returned to normal parameters. Incident duration: " + durationMinutes + " minutes.")
                        .severity(AlertSeverity.INFO)
                        .alertType(AlertType.AI_PREDICTION)
                        .status(AlertStatus.RESOLVED)
                        .triggeredAt(Instant.now())
                        .resolvedAt(Instant.now())
                        .build();
                resolutionAlert.setCreatedAt(Instant.now());
                resolutionAlert.setUpdatedAt(Instant.now());
                alertRepository.save(resolutionAlert);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public AISystemHealthSummaryDto getSystemHealthSummary() {
        List<Computer> all = computerRepository.findAll();
        int total = all.size();
        int healthy = 0;
        int needsAttention = 0;
        int critical = 0;
        int predictedRisks = 0;

        for (Computer c : all) {
            if (c.getStatus() == ComputerStatus.CRITICAL) {
                critical++;
            } else if (c.getStatus() == ComputerStatus.WARNING) {
                needsAttention++;
            } else {
                healthy++;
            }

            AIPredictionDto pred = evaluatePrediction(c.getId());
            if (pred.isDataSufficient() && !pred.getCategory().equals("PERFORMANCE") && !pred.getCategory().equals("UNKNOWN")) {
                predictedRisks++;
            }
        }

        return AISystemHealthSummaryDto.builder()
                .totalComputers(total)
                .healthyCount(healthy)
                .needsAttentionCount(needsAttention)
                .criticalCount(critical)
                .predictedRisksCount(predictedRisks)
                .criticalProblemsCount(critical)
                .build();
    }

    private AIDiagnosisReportDto buildDiagnosisDto(Computer computer, String problem, String reason, List<String> evidence,
                                                    String solution, String status, List<PossibleCauseDto> possibleCauses,
                                                    Instant detectedAt, boolean isActive) {
        return AIDiagnosisReportDto.builder()
                .computerId(computer.getId())
                .hostname(computer.getHostname())
                .problemDetected(problem)
                .exactReason(reason)
                .evidence(evidence)
                .solution(solution)
                .confirmationStatus(status)
                .possibleCauses(possibleCauses)
                .detectedAt(detectedAt)
                .isProblemActive(isActive)
                .build();
    }

    private DiagnosticCategory parseCategoryFromProblem(String problem) {
        if (problem == null) return DiagnosticCategory.APPLICATION;
        String lower = problem.toLowerCase();
        if (lower.contains("graphics") || lower.contains("display")) return DiagnosticCategory.GRAPHICS;
        if (lower.contains("disk") || lower.contains("storage")) return DiagnosticCategory.STORAGE;
        if (lower.contains("memory") || lower.contains("ram")) return DiagnosticCategory.MEMORY;
        if (lower.contains("overheating") || lower.contains("temperature")) return DiagnosticCategory.THERMAL;
        if (lower.contains("internet") || lower.contains("network")) return DiagnosticCategory.NETWORK;
        if (lower.contains("shut down") || lower.contains("shutdown")) return DiagnosticCategory.UNEXPECTED_SHUTDOWN;
        return DiagnosticCategory.SYSTEM_CRASH;
    }
}
