package com.neurosys.backend.service;

import com.neurosys.backend.dto.request.SystemMetricsIngestionRequest;
import com.neurosys.backend.dto.response.AlertDto;
import com.neurosys.backend.dto.response.HealthScoreDto;
import com.neurosys.backend.dto.response.SystemMetricDto;
import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.SystemMetric;
import com.neurosys.backend.enums.ComputerStatus;
import com.neurosys.backend.exception.ResourceNotFoundException;
import com.neurosys.backend.repository.ComputerRepository;
import com.neurosys.backend.repository.SystemMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemMetricsServiceImpl implements SystemMetricsService {

    private final SystemMetricRepository systemMetricRepository;
    private final ComputerRepository computerRepository;
    private final HealthScoreEngine healthScoreEngine;
    private final AlertEngineService alertEngineService;
    private final WebSocketMetricsPublisher webSocketMetricsPublisher;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    @Override
    @Transactional
    public SystemMetricDto ingestMetrics(SystemMetricsIngestionRequest request) {
        Computer computer = computerRepository.findByAgentId(request.getAgentId())
                .orElseThrow(() -> new ResourceNotFoundException("Computer Agent", "agentId", request.getAgentId()));

        if (computer.getStatus() == ComputerStatus.PENDING || computer.getStatus() == ComputerStatus.REJECTED) {
            log.warn("Blocking metrics ingestion for unapproved computer {} with status {}", computer.getHostname(), computer.getStatus());
            throw new IllegalStateException("Computer endpoint onboarding is " + computer.getStatus() + ". Pending administrator approval.");
        }

        String topProcJson = null;
        if (request.getTopProcesses() != null && !request.getTopProcesses().isEmpty()) {
            try {
                topProcJson = objectMapper.writeValueAsString(request.getTopProcesses());
            } catch (Exception e) {
                log.warn("Failed to serialize top processes", e);
            }
        }

        SystemMetric metric = SystemMetric.builder()
                .computer(computer)
                .cpuUsagePercent(request.getCpuUsagePercent())
                .memoryUsagePercent(request.getMemoryUsagePercent())
                .memoryUsedMb(request.getMemoryUsedMb())
                .memoryFreeMb(request.getMemoryFreeMb())
                .diskUsagePercent(request.getDiskUsagePercent())
                .diskUsedGb(request.getDiskUsedGb())
                .diskFreeGb(request.getDiskFreeGb())
                .diskReadBytesSec(request.getDiskReadBytesSec())
                .diskWriteBytesSec(request.getDiskWriteBytesSec())
                .networkRxBytesSec(request.getNetworkRxBytesSec())
                .networkTxBytesSec(request.getNetworkTxBytesSec())
                .cpuTemperature(request.getCpuTemperature())
                .activeProcessCount(request.getActiveProcessCount())
                .topProcessesJson(topProcJson)
                .recordedAt(request.getTimestamp() != null ? request.getTimestamp() : Instant.now())
                .build();

        metric = systemMetricRepository.save(metric);

        // Update Computer Status & Last Seen Timestamp
        computer.setLastSeenAt(Instant.now());
        if (request.getInternetConnected() != null) {
            computer.setInternetConnected(request.getInternetConnected());
        }
        if (request.getUptimeSeconds() != null) {
            computer.setUptimeSeconds(request.getUptimeSeconds());
        }

        if (request.getCpuUsagePercent() > 90.0 || request.getMemoryUsagePercent() > 90.0) {
            computer.setStatus(ComputerStatus.CRITICAL);
        } else if (request.getCpuUsagePercent() > 75.0 || request.getMemoryUsagePercent() > 80.0) {
            computer.setStatus(ComputerStatus.WARNING);
        } else {
            computer.setStatus(ComputerStatus.ONLINE);
        }
        computerRepository.save(computer);

        // Calculate Health Score
        HealthScoreDto healthScore = healthScoreEngine.calculateAndSaveHealthScore(computer, metric, 0.0);

        // Evaluate Alert Rules
        List<AlertDto> alerts = alertEngineService.evaluateAndTriggerAlerts(computer, metric);

        SystemMetricDto metricDto = mapToDto(metric);

        // Broadcast to WebSocket clients
        webSocketMetricsPublisher.broadcastTelemetryUpdate(metricDto, healthScore, alerts);

        return metricDto;
    }

    @Override
    @Transactional(readOnly = true)
    public List<SystemMetricDto> getMetricHistory(String computerId, int limit) {
        return systemMetricRepository.findByComputerIdOrderByRecordedAtDesc(computerId, PageRequest.of(0, limit))
                .stream().map(this::mapToDto).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public SystemMetricDto getLatestMetric(String computerId) {
        return systemMetricRepository.findLatestByComputerId(computerId)
                .map(this::mapToDto)
                .orElse(null);
    }

    private SystemMetricDto mapToDto(SystemMetric metric) {
        return SystemMetricDto.builder()
                .id(metric.getId())
                .computerId(metric.getComputer().getId())
                .hostname(metric.getComputer().getHostname())
                .cpuUsagePercent(metric.getCpuUsagePercent())
                .memoryUsagePercent(metric.getMemoryUsagePercent())
                .memoryUsedMb(metric.getMemoryUsedMb())
                .memoryFreeMb(metric.getMemoryFreeMb())
                .diskUsagePercent(metric.getDiskUsagePercent())
                .diskUsedGb(metric.getDiskUsedGb())
                .diskFreeGb(metric.getDiskFreeGb())
                .diskReadBytesSec(metric.getDiskReadBytesSec())
                .diskWriteBytesSec(metric.getDiskWriteBytesSec())
                .networkRxBytesSec(metric.getNetworkRxBytesSec())
                .networkTxBytesSec(metric.getNetworkTxBytesSec())
                .cpuTemperature(metric.getCpuTemperature())
                .activeProcessCount(metric.getActiveProcessCount())
                .recordedAt(metric.getRecordedAt())
                .build();
    }
}
