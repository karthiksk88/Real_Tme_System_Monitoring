package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.AlertDto;
import com.neurosys.backend.entity.Alert;
import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.SystemMetric;
import com.neurosys.backend.enums.AlertSeverity;
import com.neurosys.backend.enums.AlertStatus;
import com.neurosys.backend.enums.AlertType;
import com.neurosys.backend.exception.ResourceNotFoundException;
import com.neurosys.backend.repository.AlertRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AlertEngineServiceImpl implements AlertEngineService {

    private final AlertRepository alertRepository;
    private final EmailNotificationService emailNotificationService;

    private static final List<AlertStatus> ACTIVE_STATUSES = List.of(AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED);

    @Override
    @Transactional
    public List<AlertDto> evaluateAndTriggerAlerts(Computer computer, SystemMetric metric) {
        List<AlertDto> triggeredAlerts = new ArrayList<>();

        if (computer == null || metric == null) {
            return triggeredAlerts;
        }

        // When a computer posts metrics, if it previously had an active OFFLINE alert, resolve it automatically
        resolveOfflineAlert(computer);

        // Rule 1: CPU Usage (Critical >= 95%, Recovery < 90%)
        if (metric.getCpuUsagePercent() != null) {
            boolean isCpuCritical = metric.getCpuUsagePercent() >= 95.0;
            boolean isCpuRecovery = metric.getCpuUsagePercent() < 90.0;
            evaluateAlertLifecycle(
                    computer,
                    AlertType.HIGH_CPU,
                    isCpuCritical,
                    isCpuRecovery,
                    "Critical CPU Saturation (>=95%)",
                    String.format("%s CPU utilization reached %.1f%% (>=95%%). Performance degradation may occur if the current usage pattern continues.", computer.getHostname(), metric.getCpuUsagePercent()),
                    AlertSeverity.CRITICAL,
                    metric.getCpuUsagePercent(),
                    95.0,
                    triggeredAlerts
            );
        }

        // Rule 2: Memory / RAM Usage (Critical >= 95%, Recovery < 90%)
        if (metric.getMemoryUsagePercent() != null) {
            boolean isRamCritical = metric.getMemoryUsagePercent() >= 95.0;
            boolean isRamRecovery = metric.getMemoryUsagePercent() < 90.0;
            evaluateAlertLifecycle(
                    computer,
                    AlertType.HIGH_RAM,
                    isRamCritical,
                    isRamRecovery,
                    "Critical Memory Allocation (>=95%)",
                    String.format("%s memory usage reached %.1f%% (>=95%%). Available RAM is dangerously low.", computer.getHostname(), metric.getMemoryUsagePercent()),
                    AlertSeverity.CRITICAL,
                    metric.getMemoryUsagePercent(),
                    95.0,
                    triggeredAlerts
            );
        }

        // Rule 3: Disk Usage (Critical >= 95%, Recovery < 90%)
        if (metric.getDiskUsagePercent() != null) {
            boolean isDiskCritical = metric.getDiskUsagePercent() >= 95.0;
            boolean isDiskRecovery = metric.getDiskUsagePercent() < 90.0;
            evaluateAlertLifecycle(
                    computer,
                    AlertType.HIGH_DISK,
                    isDiskCritical,
                    isDiskRecovery,
                    "Critical Storage Capacity (>=95%)",
                    String.format("%s disk space utilization reached %.1f%% (>=95%%). Immediate storage cleanup is required.", computer.getHostname(), metric.getDiskUsagePercent()),
                    AlertSeverity.CRITICAL,
                    metric.getDiskUsagePercent(),
                    95.0,
                    triggeredAlerts
            );
        }

        // Rule 4: Internet Connectivity (Critical when false, Recovery when true)
        if (computer.getInternetConnected() != null) {
            boolean isInternetLost = !computer.getInternetConnected();
            boolean isInternetRestored = computer.getInternetConnected();
            evaluateAlertLifecycle(
                    computer,
                    AlertType.NO_INTERNET,
                    isInternetLost,
                    isInternetRestored,
                    "Internet Connection Lost",
                    String.format("%s is online on local network, but internet connectivity is unavailable.", computer.getHostname()),
                    AlertSeverity.CRITICAL,
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
                "Computer Endpoint Offline",
                String.format("%s missed heartbeat (>60s) and is currently offline.", computer.getHostname()),
                AlertSeverity.CRITICAL,
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
                AlertSeverity.CRITICAL,
                0.0,
                1.0,
                dummyList
        );
    }

    private void evaluateAlertLifecycle(
            Computer computer,
            AlertType alertType,
            boolean isCriticalState,
            boolean isRecoveryState,
            String title,
            String message,
            AlertSeverity severity,
            Double triggeredValue,
            Double thresholdValue,
            List<AlertDto> triggeredAlerts
    ) {
        Optional<Alert> activeAlert = alertRepository.findFirstByComputerIdAndAlertTypeAndStatusIn(
                computer.getId(), alertType, ACTIVE_STATUSES
        );

        if (isCriticalState) {
            if (activeAlert.isEmpty()) {
                // NORMAL -> CRITICAL: Create ONE alert and send ONE creation email
                Alert alert = Alert.builder()
                        .computer(computer)
                        .title(title)
                        .message(message)
                        .severity(severity)
                        .alertType(alertType)
                        .status(AlertStatus.OPEN)
                        .triggeredValue(triggeredValue)
                        .thresholdValue(thresholdValue)
                        .triggeredAt(Instant.now())
                        .build();

                alert = alertRepository.save(alert);
                log.info("New Critical Alert Created [Type: {}, Computer: {}]: {}", alertType, computer.getHostname(), title);

                emailNotificationService.sendCriticalAlertEmail(alert);
                triggeredAlerts.add(mapToDto(alert));
            } else {
                // ACTIVE CRITICAL: Update metric value on existing active alert without creating duplicate or re-sending email
                Alert existing = activeAlert.get();
                if (triggeredValue != null && !triggeredValue.equals(existing.getTriggeredValue())) {
                    existing.setTriggeredValue(triggeredValue);
                    alertRepository.save(existing);
                }
                log.debug("Active alert already exists for computer {} and type {}. Updated value to {}.",
                        computer.getHostname(), alertType, triggeredValue);
            }
        } else if (isRecoveryState) {
            if (activeAlert.isPresent()) {
                // RECOVERED: Automatically resolve active alert and send ONE recovery email
                Alert alertToResolve = activeAlert.get();
                alertToResolve.setStatus(AlertStatus.RESOLVED);
                alertToResolve.setResolvedAt(Instant.now());
                alertRepository.save(alertToResolve);

                log.info("Alert Condition Recovered. Automatically resolved alert [Type: {}, Computer: {}]",
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
        return AlertDto.builder()
                .id(alert.getId())
                .computerId(alert.getComputer().getId())
                .hostname(alert.getComputer().getHostname())
                .title(alert.getTitle())
                .message(alert.getMessage())
                .severity(alert.getSeverity().name())
                .alertType(alert.getAlertType().name())
                .status(alert.getStatus().name())
                .triggeredValue(alert.getTriggeredValue())
                .thresholdValue(alert.getThresholdValue())
                .triggeredAt(alert.getTriggeredAt())
                .resolvedAt(alert.getResolvedAt())
                .build();
    }
}
