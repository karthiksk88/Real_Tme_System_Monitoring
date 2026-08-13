package com.neurosys.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurosys.backend.dto.response.CrashPredictionResponse;
import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.Prediction;
import com.neurosys.backend.entity.SystemMetric;
import com.neurosys.backend.enums.PredictionType;
import com.neurosys.backend.exception.ResourceNotFoundException;
import com.neurosys.backend.repository.ComputerRepository;
import com.neurosys.backend.repository.PredictionRepository;
import com.neurosys.backend.repository.SystemMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrashPredictionServiceImpl implements CrashPredictionService {

    private final ComputerRepository computerRepository;
    private final SystemMetricRepository systemMetricRepository;
    private final PredictionRepository predictionRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public CrashPredictionResponse evaluateCrashRisk(String computerId) {
        Computer computer = computerRepository.findById(computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Computer", "id", computerId));

        List<SystemMetric> history = systemMetricRepository.findByComputerIdOrderByRecordedAtDesc(computerId, PageRequest.of(0, 10));

        if (history == null || history.size() < 2) {
            return CrashPredictionResponse.builder()
                    .computerId(computer.getId())
                    .hostname(computer.getHostname())
                    .predictedIssue("Insufficient Historical Data")
                    .estimatedTimeframe("N/A")
                    .riskLevel("UNKNOWN")
                    .crashProbability(0.0)
                    .confidenceScore(0.0)
                    .mainFactors(List.of("Insufficient historical data for reliable prediction."))
                    .reasons(List.of("At least 2 telemetry metrics samples are required for trend forecasting."))
                    .recommendedAction("Insufficient historical data for reliable prediction.")
                    .predictedAt(Instant.now())
                    .build();
        }

        SystemMetric latest = history.get(0);
        SystemMetric earliest = history.get(history.size() - 1);

        double cpuLatest = latest.getCpuUsagePercent() != null ? latest.getCpuUsagePercent() : 0.0;
        double cpuEarliest = earliest.getCpuUsagePercent() != null ? earliest.getCpuUsagePercent() : 0.0;
        double cpuDelta = cpuLatest - cpuEarliest;

        double ramLatest = latest.getMemoryUsagePercent() != null ? latest.getMemoryUsagePercent() : 0.0;
        double ramEarliest = earliest.getMemoryUsagePercent() != null ? earliest.getMemoryUsagePercent() : 0.0;
        double ramDelta = ramLatest - ramEarliest;

        double diskLatest = latest.getDiskUsagePercent() != null ? latest.getDiskUsagePercent() : 0.0;
        double diskEarliest = earliest.getDiskUsagePercent() != null ? earliest.getDiskUsagePercent() : 0.0;
        double diskDelta = diskLatest - diskEarliest;

        double crashProbability = 0.05;
        double confidenceScore = Math.min(0.95, 0.50 + (history.size() * 0.04));
        List<String> reasons = new ArrayList<>();
        List<String> mainFactors = new ArrayList<>();

        if (cpuLatest > 85.0) {
            crashProbability += 0.35;
            reasons.add(String.format("Severe CPU utilization detected: %.1f%%", cpuLatest));
            mainFactors.add(String.format("High CPU utilization (%.1f%%)", cpuLatest));
        } else if (cpuDelta > 5.0) {
            crashProbability += 0.15;
            reasons.add(String.format("Increasing CPU utilization trend (+%.1f%%)", cpuDelta));
            mainFactors.add(String.format("Increasing CPU usage trend (+%.1f%%)", cpuDelta));
        } else {
            mainFactors.add("Stable CPU metrics");
        }

        if (ramLatest > 85.0) {
            crashProbability += 0.35;
            reasons.add(String.format("Critical memory allocation: %.1f%% RAM utilized", ramLatest));
            mainFactors.add(String.format("Critical RAM utilization (%.1f%%)", ramLatest));
        } else if (ramDelta > 5.0) {
            crashProbability += 0.15;
            reasons.add(String.format("Increasing RAM allocation trend (+%.1f%%)", ramDelta));
            mainFactors.add(String.format("Increasing RAM allocation trend (+%.1f%%)", ramDelta));
        } else {
            mainFactors.add("Stable RAM metrics");
        }

        if (diskLatest > 90.0) {
            crashProbability += 0.25;
            reasons.add(String.format("Disk capacity near exhaustion: %.1f%% space used", diskLatest));
            mainFactors.add(String.format("Critical disk storage capacity (%.1f%%)", diskLatest));
        } else if (diskDelta > 2.0) {
            crashProbability += 0.10;
            reasons.add(String.format("Increasing disk usage trend (+%.1f%%)", diskDelta));
            mainFactors.add(String.format("Increasing disk utilization trend (+%.1f%%)", diskDelta));
        } else {
            mainFactors.add("Normal disk utilization");
        }

        if (latest.getActiveProcessCount() != null && latest.getActiveProcessCount() > 150) {
            crashProbability += 0.10;
            mainFactors.add(String.format("High process activity (%d active processes)", latest.getActiveProcessCount()));
        }

        crashProbability = Math.min(0.99, Math.max(0.01, Math.round(crashProbability * 100.0) / 100.0));

        String predictedIssue = "Optimal System Performance";
        String estimatedTimeframe = "No issue predicted within 6 months";
        String riskLevel = "LOW";
        String recommendedAction = "System operating within healthy parameters. No action required.";

        if (crashProbability > 0.60) {
            riskLevel = "HIGH";
            predictedIssue = "Performance degradation risk";
            estimatedTimeframe = "~18 days";
            recommendedAction = "Review background applications and free memory/disk resources to prevent degradation.";
        } else if (crashProbability > 0.30) {
            riskLevel = "MEDIUM";
            predictedIssue = "Elevated Resource Degradation";
            estimatedTimeframe = "~2 months";
            recommendedAction = "Monitor resource consumption trends and clear temporary application caches.";
        }

        String reasonsJson;
        try {
            reasonsJson = objectMapper.writeValueAsString(reasons);
        } catch (Exception e) {
            reasonsJson = "[]";
        }

        Prediction prediction = Prediction.builder()
                .computer(computer)
                .predictionType(PredictionType.CRASH_RISK)
                .horizonMinutes(30)
                .crashProbability(crashProbability)
                .confidenceScore(confidenceScore)
                .reasonsJson(reasonsJson)
                .recommendedAction(recommendedAction)
                .predictedAt(Instant.now())
                .build();

        predictionRepository.save(prediction);

        return CrashPredictionResponse.builder()
                .id(prediction.getId())
                .computerId(computer.getId())
                .hostname(computer.getHostname())
                .predictedIssue(predictedIssue)
                .estimatedTimeframe(estimatedTimeframe)
                .riskLevel(riskLevel)
                .crashProbability(crashProbability)
                .confidenceScore(confidenceScore)
                .mainFactors(mainFactors)
                .reasons(reasons)
                .recommendedAction(recommendedAction)
                .predictedAt(prediction.getPredictedAt())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public CrashPredictionResponse getLatestCrashPrediction(String computerId) {
        Prediction prediction = predictionRepository.findLatestByComputerIdAndType(computerId, PredictionType.CRASH_RISK)
                .orElse(null);

        if (prediction == null) {
            return evaluateCrashRisk(computerId);
        }

        List<String> reasons;
        try {
            reasons = objectMapper.readValue(prediction.getReasonsJson(), List.class);
        } catch (Exception e) {
            reasons = List.of();
        }

        double prob = prediction.getCrashProbability() != null ? prediction.getCrashProbability() : 0.05;
        String riskLevel = prob > 0.60 ? "HIGH" : (prob > 0.30 ? "MEDIUM" : "LOW");
        String predictedIssue = prob > 0.60 ? "Performance degradation" : (prob > 0.30 ? "Elevated Resource Degradation" : "Optimal System Performance");
        String estimatedTimeframe = prob > 0.60 ? "~18 days" : (prob > 0.30 ? "~2 months" : "No issue predicted");

        return CrashPredictionResponse.builder()
                .id(prediction.getId())
                .computerId(computerId)
                .hostname(prediction.getComputer().getHostname())
                .predictedIssue(predictedIssue)
                .estimatedTimeframe(estimatedTimeframe)
                .riskLevel(riskLevel)
                .crashProbability(prob)
                .confidenceScore(prediction.getConfidenceScore() != null ? prediction.getConfidenceScore() : 0.82)
                .mainFactors(reasons.isEmpty() ? List.of("Resource usage trend") : reasons)
                .reasons(reasons)
                .recommendedAction(prediction.getRecommendedAction())
                .predictedAt(prediction.getPredictedAt())
                .build();
    }
}
