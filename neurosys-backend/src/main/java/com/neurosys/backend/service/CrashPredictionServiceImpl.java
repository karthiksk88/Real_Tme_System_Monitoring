package com.neurosys.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.neurosys.backend.dto.response.CrashPredictionResponse;
import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.DiagnosticEvent;
import com.neurosys.backend.entity.Prediction;
import com.neurosys.backend.entity.SystemMetric;
import com.neurosys.backend.enums.PredictionType;
import com.neurosys.backend.exception.ResourceNotFoundException;
import com.neurosys.backend.repository.ComputerRepository;
import com.neurosys.backend.repository.DiagnosticEventRepository;
import com.neurosys.backend.repository.PredictionRepository;
import com.neurosys.backend.repository.SystemMetricRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class CrashPredictionServiceImpl implements CrashPredictionService {

    private final ComputerRepository computerRepository;
    private final SystemMetricRepository systemMetricRepository;
    private final DiagnosticEventRepository diagnosticEventRepository;
    private final PredictionRepository predictionRepository;
    private final ObjectMapper objectMapper;

    private static final String MODEL_VERSION = "NeuroSys Trend Model v1.0";
    private static final int MIN_HISTORICAL_SAMPLES = 10;
    private static final long CACHE_VALIDITY_MINUTES = 10;

    // Fast, thread-safe in-memory cache for deterministic page-refresh consistency
    private final Map<String, CrashPredictionResponse> cacheMap = new ConcurrentHashMap<>();

    @Override
    @Transactional(readOnly = true)
    public CrashPredictionResponse evaluateCrashRisk(String computerId) {
        Computer computer = computerRepository.findById(computerId)
                .orElseThrow(() -> new ResourceNotFoundException("Computer", "id", computerId));

        // 1. Fetch up to 100 historical telemetry metric samples for THIS computer
        List<SystemMetric> rawHistory = systemMetricRepository.findByComputerIdOrderByRecordedAtDesc(
                computerId, PageRequest.of(0, 100));

        if (rawHistory == null || rawHistory.size() < MIN_HISTORICAL_SAMPLES) {
            int sampleCount = rawHistory != null ? rawHistory.size() : 0;
            log.info("[INFO] Insufficient historical data for computer {} ({}/{} samples). Returning Data Sufficiency: Pending.",
                    computer.getHostname(), sampleCount, MIN_HISTORICAL_SAMPLES);

            CrashPredictionResponse pendingResponse = CrashPredictionResponse.builder()
                    .computerId(computer.getId())
                    .hostname(computer.getHostname())
                    .isDataSufficient(false)
                    .insufficientDataReason(String.format("Not enough historical telemetry data for %s (%d/%d samples collected).",
                            computer.getHostname(), sampleCount, MIN_HISTORICAL_SAMPLES))
                    .predictedIssue("Prediction Unavailable")
                    .estimatedTimeframe("N/A")
                    .riskLevel("UNKNOWN")
                    .crashProbability(0.0)
                    .confidenceScore(0.0)
                    .confidencePercent(0)
                    .mainFactors(List.of("Not enough historical telemetry for this computer."))
                    .reasons(List.of("Continue running the agent to collect telemetry trends for accurate forecasting."))
                    .contributingFactors(List.of("Continue running the agent to collect telemetry trends for accurate forecasting."))
                    .historicalData(List.of())
                    .predictedData(List.of())
                    .recommendedAction("Continue running the agent to collect telemetry trends for accurate forecasting.")
                    .modelVersion(MODEL_VERSION)
                    .dataStartDate(Instant.now())
                    .dataEndDate(Instant.now())
                    .predictedAt(Instant.now())
                    .build();

            cacheMap.put(computerId, pendingResponse);
            return pendingResponse;
        }

        // Sort historical telemetry chronologically ascending (t0 -> tN)
        List<SystemMetric> history = new ArrayList<>(rawHistory);
        Collections.reverse(history);

        Instant startDate = history.get(0).getRecordedAt() != null ? history.get(0).getRecordedAt() : Instant.now();
        Instant endDate = history.get(history.size() - 1).getRecordedAt() != null ? history.get(history.size() - 1).getRecordedAt() : Instant.now();

        // 2. Least Squares Linear Regression over real historical metrics
        int n = history.size();
        double[] t = new double[n];
        double[] ram = new double[n];
        double[] cpu = new double[n];
        double[] diskFree = new double[n];

        double sumT = 0, sumRam = 0, sumCpu = 0, sumDiskFree = 0;
        double sumT2 = 0, sumTRam = 0, sumTCpu = 0, sumTDiskFree = 0;

        for (int i = 0; i < n; i++) {
            SystemMetric m = history.get(i);
            t[i] = i; // time index sequence
            ram[i] = m.getMemoryUsagePercent() != null ? m.getMemoryUsagePercent() : 0.0;
            cpu[i] = m.getCpuUsagePercent() != null ? m.getCpuUsagePercent() : 0.0;
            diskFree[i] = m.getDiskFreeGb() != null ? m.getDiskFreeGb() : 100.0;

            sumT += t[i];
            sumRam += ram[i];
            sumCpu += cpu[i];
            sumDiskFree += diskFree[i];

            sumT2 += t[i] * t[i];
            sumTRam += t[i] * ram[i];
            sumTCpu += t[i] * cpu[i];
            sumTDiskFree += t[i] * diskFree[i];
        }

        double denominator = (n * sumT2 - sumT * sumT);
        if (denominator == 0) denominator = 1.0;

        double slopeRam = (n * sumTRam - sumT * sumRam) / denominator;
        double slopeCpu = (n * sumTCpu - sumT * sumCpu) / denominator;
        double slopeDiskFree = (n * sumTDiskFree - sumT * sumDiskFree) / denominator;

        double interceptRam = (sumRam - slopeRam * sumT) / n;

        // Calculate Coefficient of Determination (R^2) for statistical confidence
        double meanRam = sumRam / n;
        double ssTot = 0, ssRes = 0;
        for (int i = 0; i < n; i++) {
            double pred = slopeRam * t[i] + interceptRam;
            ssTot += (ram[i] - meanRam) * (ram[i] - meanRam);
            ssRes += (ram[i] - pred) * (ram[i] - pred);
        }
        double rSquared = ssTot > 0 ? Math.max(0.0, 1.0 - (ssRes / ssTot)) : 0.85;

        // Scaled Statistical Confidence Percentage (70% - 96%)
        int confidencePercent = Math.min(96, Math.max(70, (int) (70 + (rSquared * 26))));
        double confidenceScore = confidencePercent / 100.0;

        // 3. Fetch Real Diagnostic Crash History for computer (last 30 days)
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<DiagnosticEvent> recentEvents = diagnosticEventRepository.findByComputerIdOrderByOccurredAtDesc(
                computerId, PageRequest.of(0, 50)).stream()
                .filter(e -> e.getOccurredAt() != null && e.getOccurredAt().isAfter(thirtyDaysAgo))
                .toList();

        long crashCount = recentEvents.stream()
                .filter(e -> e.getCategory() != null && e.getCategory().name().contains("CRASH"))
                .count();

        // 4. Specific Prediction Target Resolution
        SystemMetric latestMetric = history.get(n - 1);
        double currentRam = latestMetric.getMemoryUsagePercent() != null ? latestMetric.getMemoryUsagePercent() : 0.0;
        double currentCpu = latestMetric.getCpuUsagePercent() != null ? latestMetric.getCpuUsagePercent() : 0.0;
        double currentDiskFree = latestMetric.getDiskFreeGb() != null ? latestMetric.getDiskFreeGb() : 100.0;
        double currentDiskPercent = latestMetric.getDiskUsagePercent() != null ? latestMetric.getDiskUsagePercent() : 0.0;
        int activeProcesses = latestMetric.getActiveProcessCount() != null ? latestMetric.getActiveProcessCount() : 0;

        String predictedIssue;
        String estimatedTimeframe;
        String riskLevel;
        double crashProbability;
        String recommendedAction;

        // Target A: Storage Exhaustion Risk
        if (slopeDiskFree < -0.05 && currentDiskFree <= 25.0) {
            int estDays = Math.max(1, (int) Math.round((currentDiskFree - 5.0) / Math.abs(slopeDiskFree * 10)));
            predictedIssue = "Storage Exhaustion Risk";
            estimatedTimeframe = String.format("~%d days", estDays);
            riskLevel = estDays <= 7 ? "HIGH" : "MEDIUM";
            crashProbability = estDays <= 7 ? 0.78 : 0.48;
            recommendedAction = "Clean up temporary files, clear system caches, and uninstall unused applications to preserve storage capacity.";

        // Target B: Memory Performance Degradation Risk
        } else if (currentRam >= 85.0 || (slopeRam > 0.1 && currentRam >= 75.0)) {
            double ramNeeded = Math.max(1.0, 95.0 - currentRam);
            int estDays = slopeRam > 0.05 ? Math.max(1, (int) Math.round(ramNeeded / (slopeRam * 2.0))) : 12;
            predictedIssue = "Memory Performance Degradation Risk";
            estimatedTimeframe = String.format("~%d days", estDays);
            riskLevel = currentRam >= 90.0 ? "HIGH" : "MEDIUM";
            crashProbability = currentRam >= 90.0 ? 0.72 : 0.42;
            recommendedAction = "Monitor memory-heavy background processes, clear application caches, or restart long-running services.";

        // Target C: Processor Saturation Risk
        } else if (currentCpu >= 80.0 || (slopeCpu > 0.2 && currentCpu >= 70.0)) {
            predictedIssue = "Processor Saturation Risk";
            estimatedTimeframe = "~7 days";
            riskLevel = "MEDIUM";
            crashProbability = 0.45;
            recommendedAction = "Review CPU-intensive application workloads and optimize thread concurrency.";

        // Target D: System Instability & Crash Risk
        } else if (crashCount > 0) {
            predictedIssue = "System Instability & Crash Risk";
            estimatedTimeframe = "~14 days";
            riskLevel = crashCount >= 3 ? "HIGH" : "MEDIUM";
            crashProbability = crashCount >= 3 ? 0.82 : 0.52;
            recommendedAction = "Check Windows System Log event records and update hardware device drivers.";

        // Target E: Optimal System Performance
        } else {
            predictedIssue = "Optimal System Performance";
            estimatedTimeframe = "No issue predicted within 6 months";
            riskLevel = "LOW";
            crashProbability = 0.05;
            recommendedAction = "System operating within healthy parameters. Maintain standard operational monitoring.";
        }

        // 5. Generate Computer-Specific Contributing Evidence Factors
        List<String> contributingFactors = new ArrayList<>();
        contributingFactors.add(String.format("Current RAM utilization: %.1f%% (Average over history: %.1f%%).", currentRam, meanRam));
        if (slopeRam > 0.05) {
            contributingFactors.add(String.format("RAM usage shows an increasing trend (+%.2f%% per sampling cycle).", slopeRam));
        } else {
            contributingFactors.add("RAM utilization trend remains stable across sampling history.");
        }

        if (currentCpu >= 80.0) {
            contributingFactors.add(String.format("Elevated CPU utilization recorded (%.1f%%).", currentCpu));
        } else {
            contributingFactors.add(String.format("CPU metrics remain within normal operating parameters (%.1f%%).", currentCpu));
        }

        contributingFactors.add(String.format("Storage free capacity: %.1f GB (%.1f%% used).", currentDiskFree, currentDiskPercent));

        if (activeProcesses > 0) {
            contributingFactors.add(String.format("Active system process count: %d processes.", activeProcesses));
        }

        if (crashCount > 0) {
            contributingFactors.add(String.format("Recorded %d critical system crash events in the last 30 days.", crashCount));
        }

        // 6. Build Graph Data (Actual Historical Points + Model Predicted Extrapolation)
        List<Map<String, Object>> historicalGraph = new ArrayList<>();
        List<Map<String, Object>> predictedGraph = new ArrayList<>();

        for (int i = 0; i < n; i++) {
            SystemMetric m = history.get(i);
            Map<String, Object> point = new HashMap<>();
            String timeStr = m.getRecordedAt() != null ? m.getRecordedAt().toString() : Instant.now().toString();
            point.put("date", timeStr.length() >= 16 ? timeStr.substring(11, 16) : timeStr);
            point.put("actualScore", Math.round(m.getCpuUsagePercent() != null ? m.getCpuUsagePercent() : 0.0));
            point.put("predictedScore", null);
            point.put("isPrediction", false);
            historicalGraph.add(point);
        }

        // Add Transition Point ("Today")
        double lastValue = history.get(n - 1).getCpuUsagePercent() != null ? history.get(n - 1).getCpuUsagePercent() : 35.0;
        Map<String, Object> todayPoint = new HashMap<>();
        todayPoint.put("date", "Today");
        todayPoint.put("actualScore", Math.round(lastValue));
        todayPoint.put("predictedScore", Math.round(lastValue));
        todayPoint.put("isPrediction", false);
        historicalGraph.add(todayPoint);

        // Extrapolate Linear Regression Prediction (+10d, +20d, +30d, +60d)
        double trendSlope = Math.max(-0.5, Math.min(1.5, slopeCpu));
        int[] futureDays = new int[]{10, 20, 30, 60};
        for (int day : futureDays) {
            double projected = Math.min(98.0, Math.max(10.0, lastValue + (day * trendSlope)));
            Map<String, Object> fPoint = new HashMap<>();
            fPoint.put("date", String.format("+%dd", day));
            fPoint.put("actualScore", null);
            fPoint.put("predictedScore", Math.round(projected));
            fPoint.put("isPrediction", true);
            predictedGraph.add(fPoint);
        }

        CrashPredictionResponse response = CrashPredictionResponse.builder()
                .id(UUID.randomUUID().toString())
                .computerId(computer.getId())
                .hostname(computer.getHostname())
                .isDataSufficient(true)
                .insufficientDataReason(null)
                .predictedIssue(predictedIssue)
                .estimatedTimeframe(estimatedTimeframe)
                .riskLevel(riskLevel)
                .crashProbability(crashProbability)
                .confidenceScore(confidenceScore)
                .confidencePercent(confidencePercent)
                .mainFactors(contributingFactors)
                .reasons(contributingFactors)
                .contributingFactors(contributingFactors)
                .historicalData(historicalGraph)
                .predictedData(predictedGraph)
                .recommendedAction(recommendedAction)
                .modelVersion(MODEL_VERSION)
                .dataStartDate(startDate)
                .dataEndDate(endDate)
                .predictedAt(Instant.now())
                .build();

        cacheMap.put(computerId, response);
        log.info("[INFO] Evaluated deterministic trend prediction for {} [Issue: {}, Risk: {}, Confidence: {}%]",
                computer.getHostname(), predictedIssue, riskLevel, confidencePercent);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public CrashPredictionResponse getLatestCrashPrediction(String computerId) {
        CrashPredictionResponse cached = cacheMap.get(computerId);
        if (cached != null && cached.getPredictedAt() != null &&
                cached.getPredictedAt().isAfter(Instant.now().minus(CACHE_VALIDITY_MINUTES, ChronoUnit.MINUTES))) {
            return cached;
        }

        return evaluateCrashRisk(computerId);
    }
}
