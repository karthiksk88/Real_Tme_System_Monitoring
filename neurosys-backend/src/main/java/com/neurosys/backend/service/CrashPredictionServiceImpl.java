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

        SystemMetric latestMetric = systemMetricRepository.findLatestByComputerId(computerId).orElse(null);

        double crashProbability = 0.05;
        double confidenceScore = 0.82;
        List<String> reasons = new ArrayList<>();
        List<String> mainFactors = new ArrayList<>();
        String predictedIssue = "Optimal System Performance";
        String estimatedTimeframe = "No issue predicted within 6 months";
        String riskLevel = "LOW";
        String recommendedAction = "System operating within healthy parameters. No action required.";

        if (latestMetric != null) {
            if (latestMetric.getCpuUsagePercent() > 85.0) {
                crashProbability += 0.35;
                reasons.add(String.format("Severe CPU saturation detected: %.1f%% utilization", latestMetric.getCpuUsagePercent()));
                mainFactors.add("CPU usage trend");
            }
            if (latestMetric.getMemoryUsagePercent() > 85.0) {
                crashProbability += 0.35;
                reasons.add(String.format("Critical memory allocation: %.1f%% RAM utilized", latestMetric.getMemoryUsagePercent()));
                mainFactors.add("RAM usage trend");
            }
            if (latestMetric.getDiskUsagePercent() > 90.0) {
                crashProbability += 0.20;
                reasons.add(String.format("Disk capacity near exhaustion: %.1f%% space used", latestMetric.getDiskUsagePercent()));
                mainFactors.add("Disk usage trend");
            }
            if (latestMetric.getCpuTemperature() != null && latestMetric.getCpuTemperature() > 80.0) {
                crashProbability += 0.10;
                reasons.add(String.format("Thermal throttling risk: CPU temperature %.1f°C", latestMetric.getCpuTemperature()));
                mainFactors.add("Thermal throttling");
            }
            if (latestMetric.getActiveProcessCount() != null && latestMetric.getActiveProcessCount() > 150) {
                mainFactors.add("High background process activity");
            }
        }

        crashProbability = Math.min(0.99, Math.max(0.01, Math.round(crashProbability * 100.0) / 100.0));

        if (crashProbability > 0.60) {
            riskLevel = "HIGH";
            predictedIssue = "Performance degradation";
            estimatedTimeframe = "~18 days";
            recommendedAction = "Review background applications and free memory/disk resources to prevent degradation.";
        } else if (crashProbability > 0.30) {
            riskLevel = "MEDIUM";
            predictedIssue = "Elevated Resource Degradation";
            estimatedTimeframe = "~2 months";
            recommendedAction = "Monitor resource consumption trends and clear temporary application caches.";
        } else {
            mainFactors.add("Stable CPU/RAM metrics");
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
