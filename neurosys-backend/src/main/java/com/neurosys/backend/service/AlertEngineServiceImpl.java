package com.neurosys.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurosys.backend.dto.response.AlertDto;
import com.neurosys.backend.entity.Alert;
import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.DiagnosticEvent;
import com.neurosys.backend.entity.SystemMetric;
import com.neurosys.backend.enums.AlertSeverity;
import com.neurosys.backend.enums.AlertStatus;
import com.neurosys.backend.enums.AlertType;
import com.neurosys.backend.enums.DiagnosticCategory;
import com.neurosys.backend.exception.ResourceNotFoundException;
import com.neurosys.backend.repository.AlertRepository;
import com.neurosys.backend.repository.DiagnosticEventRepository;
import com.neurosys.backend.repository.SystemMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertEngineServiceImpl implements AlertEngineService {

    private final AlertRepository alertRepository;
    private final SystemMetricRepository systemMetricRepository;
    private final DiagnosticEventRepository diagnosticEventRepository;
    private final EmailNotificationService emailNotificationService;
    private final ObjectMapper objectMapper;

    private static final List<AlertStatus> ACTIVE_STATUSES = List.of(AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED);

    // Configurable persistent thresholds & window sizes
    private static final double CPU_WARNING_THRESHOLD = 90.0;
    private static final double RAM_WARNING_THRESHOLD = 90.0;
    private static final double RAM_CRITICAL_THRESHOLD = 95.0;
    private static final double DISK_WARNING_THRESHOLD = 90.0;
    private static final double DISK_CRITICAL_THRESHOLD = 95.0;
    private static final int HISTORY_WINDOW_SIZE = 10;
    private static final int MIN_SUSTAINED_SAMPLES = 7; // Requires 70%+ of historical samples to confirm persistence

    @Override
    @Transactional
    public List<AlertDto> evaluateAndTriggerAlerts(Computer computer, SystemMetric metric) {
        List<AlertDto> triggeredAlerts = new ArrayList<>();

        if (computer == null || metric == null) {
            return triggeredAlerts;
        }

        // When a computer posts metrics, if it previously had an active OFFLINE alert, resolve it automatically
        resolveOfflineAlert(computer);

        // Fetch recent telemetry history (up to 10 latest samples) to evaluate persistence
        List<SystemMetric> history = systemMetricRepository.findByComputerIdOrderByRecordedAtDesc(
                computer.getId(), PageRequest.of(0, HISTORY_WINDOW_SIZE));

        if (history == null || history.size() < 3) {
            // Insufficient history to determine persistent trend — ignore single spikes
            log.debug("Insufficient telemetry history ({}) for computer {}. Skipping persistent alert evaluation.",
                    history != null ? history.size() : 0, computer.getHostname());
            return triggeredAlerts;
        }

        int totalSamples = history.size();

        // ----------------------------------------------------
        // 1. PERSISTENT CPU EVALUATION
        // ----------------------------------------------------
        long highCpuCount = history.stream()
                .filter(m -> m.getCpuUsagePercent() != null && m.getCpuUsagePercent() >= CPU_WARNING_THRESHOLD)
                .count();

        long lowCpuCount = history.stream()
                .filter(m -> m.getCpuUsagePercent() != null && m.getCpuUsagePercent() < 80.0)
                .count();

        boolean isCpuPersistent = totalSamples >= 5 && highCpuCount >= Math.min(totalSamples - 1, MIN_SUSTAINED_SAMPLES);
        boolean isCpuRecovery = lowCpuCount >= 3;

        List<String> cpuEvidence = List.of(
                String.format("CPU usage remained above 90%% in %d out of the last %d telemetry samples.", highCpuCount, totalSamples),
                String.format("Latest recorded CPU utilization: %.1f%%.", metric.getCpuUsagePercent()),
                "Sustained processor load may cause system slowness or unresponsiveness."
        );

        evaluateAlertLifecycle(
                computer,
                AlertType.HIGH_CPU,
                isCpuPersistent,
                isCpuRecovery,
                String.format("🟡 %s needs attention", computer.getHostname()),
                "CPU usage has remained unusually high for sustained monitoring.",
                "Check which applications are using the CPU and restart the computer if necessary.",
                cpuEvidence,
                AlertSeverity.WARNING,
                metric.getCpuUsagePercent(),
                CPU_WARNING_THRESHOLD,
                triggeredAlerts
        );

        // ----------------------------------------------------
        // 2. PERSISTENT MEMORY (RAM) EVALUATION
        // ----------------------------------------------------
        long highRamCount = history.stream()
                .filter(m -> m.getMemoryUsagePercent() != null && m.getMemoryUsagePercent() >= RAM_WARNING_THRESHOLD)
                .count();

        long criticalRamCount = history.stream()
                .filter(m -> m.getMemoryUsagePercent() != null && m.getMemoryUsagePercent() >= RAM_CRITICAL_THRESHOLD)
                .count();

        long lowRamCount = history.stream()
                .filter(m -> m.getMemoryUsagePercent() != null && m.getMemoryUsagePercent() < 85.0)
                .count();

        boolean isRamPersistent = totalSamples >= 5 && highRamCount >= Math.min(totalSamples - 1, MIN_SUSTAINED_SAMPLES);
        boolean isRamCritical = criticalRamCount >= Math.min(totalSamples - 1, MIN_SUSTAINED_SAMPLES);
        boolean isRamRecovery = lowRamCount >= 3;

        AlertSeverity ramSeverity = isRamCritical ? AlertSeverity.CRITICAL : AlertSeverity.WARNING;
        String ramTitle = isRamCritical 
                ? String.format("🔴 %s — CRITICAL MEMORY EXHAUSTION", computer.getHostname())
                : String.format("🟡 %s needs attention", computer.getHostname());

        List<String> ramEvidence = List.of(
                String.format("RAM usage remained above 90%% in %d out of the last %d telemetry samples.", highRamCount, totalSamples),
                String.format("Latest recorded RAM allocation: %.1f%% (%.0f MB free).", metric.getMemoryUsagePercent(), metric.getMemoryFreeMb() != null ? metric.getMemoryFreeMb() : 0.0),
                "Available memory is dangerously low, increasing system instability risk."
        );

        evaluateAlertLifecycle(
                computer,
                AlertType.HIGH_RAM,
                isRamPersistent,
                isRamRecovery,
                ramTitle,
                "Memory allocation has remained continuously high.",
                "Close memory-intensive background applications or restart long-running services.",
                ramEvidence,
                ramSeverity,
                metric.getMemoryUsagePercent(),
                isRamCritical ? RAM_CRITICAL_THRESHOLD : RAM_WARNING_THRESHOLD,
                triggeredAlerts
        );

        // ----------------------------------------------------
        // 3. PERSISTENT DISK EVALUATION & PREDICTION
        // ----------------------------------------------------
        double diskPercent = metric.getDiskUsagePercent() != null ? metric.getDiskUsagePercent() : 0.0;
        double freeDiskGb = metric.getDiskUsedGb() != null && metric.getDiskFreeGb() != null ? metric.getDiskFreeGb() : 100.0;

        boolean isDiskWarning = diskPercent >= DISK_WARNING_THRESHOLD || freeDiskGb <= 10.0;
        boolean isDiskCritical = diskPercent >= DISK_CRITICAL_THRESHOLD || freeDiskGb <= 5.0;
        boolean isDiskRecovery = diskPercent < 85.0 && freeDiskGb > 15.0;

        // Calculate rate of consumption for storage prediction
        double oldestDiskGb = history.get(history.size() - 1).getDiskFreeGb() != null ? history.get(history.size() - 1).getDiskFreeGb() : freeDiskGb;
        double diskBurnGb = oldestDiskGb - freeDiskGb;
        int estimatedDays = diskBurnGb > 0.5 ? Math.max(1, (int)(freeDiskGb / diskBurnGb * 2.0)) : 6;

        String diskMsg = isDiskCritical
                ? String.format("Disk space is critically low (%.1f GB free remaining). At current usage, storage may run out in ~%d days.", freeDiskGb, estimatedDays)
                : String.format("Free storage space is running low (%.1f%% used).", diskPercent);

        List<String> diskEvidence = List.of(
                String.format("Storage utilization is currently %.1f%%.", diskPercent),
                String.format("Free storage space remaining: %.1f GB.", freeDiskGb),
                String.format("Calculated storage exhaustion horizon: ~%d days.", estimatedDays)
        );

        evaluateAlertLifecycle(
                computer,
                AlertType.HIGH_DISK,
                isDiskWarning || isDiskCritical,
                isDiskRecovery,
                isDiskCritical ? String.format("🔴 %s — CRITICAL STORAGE LOW", computer.getHostname()) : String.format("🟡 %s needs attention", computer.getHostname()),
                diskMsg,
                "Clean up temporary files, clear system caches, and uninstall unused applications.",
                diskEvidence,
                isDiskCritical ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
                diskPercent,
                isDiskCritical ? DISK_CRITICAL_THRESHOLD : DISK_WARNING_THRESHOLD,
                triggeredAlerts
        );

        // ----------------------------------------------------
        // 4. MULTI-FACTOR HIGH SYSTEM FAILURE RISK EVALUATION
        // ----------------------------------------------------
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        List<DiagnosticEvent> recentCrashes = diagnosticEventRepository.findByComputerIdOrderByOccurredAtDesc(
                computer.getId(), PageRequest.of(0, 10)).stream()
                .filter(e -> e.getOccurredAt().isAfter(sevenDaysAgo) && 
                        (e.getCategory() == DiagnosticCategory.GRAPHICS || e.getCategory() == DiagnosticCategory.UNEXPECTED_SHUTDOWN || e.getCategory() == DiagnosticCategory.SYSTEM_CRASH))
                .toList();

        boolean isHighTemp = metric.getCpuTemperature() != null && metric.getCpuTemperature() >= 80.0;
        int activeFailureFactors = 0;
        if (isCpuPersistent) activeFailureFactors++;
        if (isRamPersistent) activeFailureFactors++;
        if (isHighTemp) activeFailureFactors++;
        if (!recentCrashes.isEmpty()) activeFailureFactors++;

        boolean isHighFailureRisk = activeFailureFactors >= 3;
        boolean isFailureRiskResolved = activeFailureFactors < 2;

        List<String> riskEvidence = List.of(
                String.format("CPU usage sustained above 90%% (%s).", isCpuPersistent ? "YES" : "NO"),
                String.format("RAM allocation sustained above 90%% (%s).", isRamPersistent ? "YES" : "NO"),
                String.format("System crashes recorded in last 7 days: %d events.", recentCrashes.size()),
                String.format("Processor thermal workload: %s.", isHighTemp ? String.format("%.1f°C", metric.getCpuTemperature()) : "Normal")
        );

        evaluateAlertLifecycle(
                computer,
                AlertType.HIGH_RISK,
                isHighFailureRisk,
                isFailureRiskResolved,
                String.format("🔴 %s — HIGH FAILURE RISK", computer.getHostname()),
                "This computer has been under heavy load for a sustained period and has experienced repeated system errors.",
                "Inspect the computer before it fails. Check thermal cooling, verify RAM integrity, and review Windows system logs.",
                riskEvidence,
                AlertSeverity.CRITICAL,
                (double) activeFailureFactors,
                3.0,
                triggeredAlerts
        );

        // ----------------------------------------------------
        // 5. INTERNET CONNECTIVITY EVALUATION
        // ----------------------------------------------------
        if (computer.getInternetConnected() != null) {
            boolean isInternetLost = !computer.getInternetConnected();
            boolean isInternetRestored = computer.getInternetConnected();
            evaluateAlertLifecycle(
                    computer,
                    AlertType.NO_INTERNET,
                    isInternetLost,
                    isInternetRestored,
                    String.format("🟡 %s — Internet Connection Lost", computer.getHostname()),
                    String.format("%s is online on local network, but internet connectivity is unavailable.", computer.getHostname()),
                    "Check network cable, Wi-Fi router, or default gateway routing.",
                    List.of("Local network adapter active.", "External gateway ping failed."),
                    AlertSeverity.WARNING,
                    0.0,
                    1.0,
                    triggeredAlerts
            );
        }

        return triggeredAlerts;
    }

    @Override
    @Transactional
    public void triggerOfflineAlert(Computer computer) {
        if (computer == null) return;
        List<AlertDto> dummyList = new ArrayList<>();
        evaluateAlertLifecycle(
                computer,
                AlertType.OFFLINE,
                true,
                false,
                String.format("⚪ %s Endpoint Offline", computer.getHostname()),
                String.format("%s missed telemetry heartbeat (>60s) and is currently offline.", computer.getHostname()),
                "Check computer power supply and physical network connection.",
                List.of("No telemetry heartbeat received for >60 seconds.", "Computer marked OFFLINE in system inventory."),
                AlertSeverity.WARNING,
                0.0,
                1.0,
                dummyList
        );
    }

    @Override
    @Transactional
    public void resolveOfflineAlert(Computer computer) {
        if (computer == null) return;
        List<AlertDto> dummyList = new ArrayList<>();
        evaluateAlertLifecycle(
                computer,
                AlertType.OFFLINE,
                false,
                true,
                "Computer Endpoint Offline",
                "",
                "",
                List.of(),
                AlertSeverity.WARNING,
                0.0,
                1.0,
                dummyList
        );
    }

    private void evaluateAlertLifecycle(
            Computer computer,
            AlertType alertType,
            boolean isPersistentCondition,
            boolean isRecoveryCondition,
            String title,
            String message,
            String recommendedAction,
            List<String> evidenceList,
            AlertSeverity severity,
            Double triggeredValue,
            Double thresholdValue,
            List<AlertDto> triggeredAlerts
    ) {
        Optional<Alert> activeAlert = alertRepository.findFirstByComputerIdAndAlertTypeAndStatusIn(
                computer.getId(), alertType, ACTIVE_STATUSES
        );

        String evidenceJson = null;
        if (evidenceList != null && !evidenceList.isEmpty()) {
            try {
                evidenceJson = objectMapper.writeValueAsString(evidenceList);
            } catch (Exception e) {
                evidenceJson = "[]";
            }
        }

        if (isPersistentCondition) {
            if (activeAlert.isEmpty()) {
                // Persistent condition confirmed -> Create ONE active incident/alert
                Alert alert = Alert.builder()
                        .computer(computer)
                        .title(title)
                        .message(message)
                        .recommendedAction(recommendedAction)
                        .evidenceJson(evidenceJson)
                        .severity(severity)
                        .alertType(alertType)
                        .status(AlertStatus.OPEN)
                        .triggeredValue(triggeredValue)
                        .thresholdValue(thresholdValue)
                        .occurrenceCount(1)
                        .firstDetectedAt(Instant.now())
                        .lastDetectedAt(Instant.now())
                        .triggeredAt(Instant.now())
                        .build();

                alert = alertRepository.save(alert);
                log.info("[INFO] Persistent Alert Created [Type: {}, Computer: {}]: {}", alertType, computer.getHostname(), title);

                emailNotificationService.sendCriticalAlertEmail(alert);
                triggeredAlerts.add(mapToDto(alert));
            } else {
                // Problem remains ACTIVE -> Update existing active incident (DEDUPLICATION GUARANTEE)
                Alert existing = activeAlert.get();
                existing.setOccurrenceCount((existing.getOccurrenceCount() != null ? existing.getOccurrenceCount() : 1) + 1);
                existing.setLastDetectedAt(Instant.now());
                existing.setTriggeredValue(triggeredValue);
                if (evidenceJson != null) existing.setEvidenceJson(evidenceJson);
                existing.setSeverity(severity); // Upgrade WARNING to CRITICAL if severity escalated
                
                alertRepository.save(existing);
                log.debug("[INFO] Updated active incident [Type: {}, Computer: {}] (Occurrences: {})",
                        alertType, computer.getHostname(), existing.getOccurrenceCount());
            }
        } else if (isRecoveryCondition) {
            if (activeAlert.isPresent()) {
                // Condition Recovered -> Resolve existing active incident
                Alert alertToResolve = activeAlert.get();
                alertToResolve.setStatus(AlertStatus.RESOLVED);
                alertToResolve.setResolvedAt(Instant.now());
                alertRepository.save(alertToResolve);

                log.info("[INFO] Alert Condition Recovered. Resolved incident [Type: {}, Computer: {}]",
                        alertType, computer.getHostname());

                emailNotificationService.sendAlertRecoveryEmail(alertToResolve);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertDto> getAllAlerts() {
        return alertRepository.findAll().stream().map(this::mapToDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<AlertDto> getComputerAlerts(String computerId) {
        return alertRepository.findByComputerIdOrderByTriggeredAtDesc(computerId)
                .stream().map(this::mapToDto).toList();
    }

    @Override
    @Transactional
    public AlertDto acknowledgeAlert(String alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));
        alert.setStatus(AlertStatus.ACKNOWLEDGED);
        alert = alertRepository.save(alert);
        return mapToDto(alert);
    }

    @Override
    @Transactional
    public AlertDto resolveAlert(String alertId) {
        Alert alert = alertRepository.findById(alertId)
                .orElseThrow(() -> new ResourceNotFoundException("Alert", "id", alertId));
        alert.setStatus(AlertStatus.RESOLVED);
        alert.setResolvedAt(Instant.now());
        alert = alertRepository.save(alert);
        return mapToDto(alert);
    }

    private AlertDto mapToDto(Alert alert) {
        List<String> evidence = new ArrayList<>();
        if (alert.getEvidenceJson() != null && !alert.getEvidenceJson().isEmpty()) {
            try {
                evidence = objectMapper.readValue(alert.getEvidenceJson(), List.class);
            } catch (Exception ignored) {
            }
        }

        return AlertDto.builder()
                .id(alert.getId())
                .computerId(alert.getComputer().getId())
                .hostname(alert.getComputer().getHostname())
                .title(alert.getTitle())
                .message(alert.getMessage())
                .recommendedAction(alert.getRecommendedAction())
                .evidence(evidence)
                .severity(alert.getSeverity().name())
                .alertType(alert.getAlertType().name())
                .status(alert.getStatus().name())
                .triggeredValue(alert.getTriggeredValue())
                .thresholdValue(alert.getThresholdValue())
                .occurrenceCount(alert.getOccurrenceCount() != null ? alert.getOccurrenceCount() : 1)
                .firstDetectedAt(alert.getFirstDetectedAt() != null ? alert.getFirstDetectedAt() : alert.getTriggeredAt())
                .lastDetectedAt(alert.getLastDetectedAt() != null ? alert.getLastDetectedAt() : alert.getTriggeredAt())
                .triggeredAt(alert.getTriggeredAt())
                .resolvedAt(alert.getResolvedAt())
                .build();
    }
}
