package com.neurosys.backend.controller;

import com.neurosys.backend.dto.request.SystemMetricsIngestionRequest;
import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.dto.response.SystemMetricDto;
import com.neurosys.backend.service.SystemMetricsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/v1/agent/metrics", "/api/agent/metrics"})
@RequiredArgsConstructor
@Tag(name = "Metrics Ingestion Endpoint", description = "REST API receiving hardware telemetry from OSHI monitoring agents")
public class SystemMetricsController {

    private final SystemMetricsService systemMetricsService;

    @PostMapping
    @Operation(summary = "Ingest System Metrics", description = "Ingest CPU, RAM, Disk, Network, Temp, and Process metrics from monitoring agent")
    public ResponseEntity<ApiResponse<SystemMetricDto>> ingestMetrics(@Valid @RequestBody SystemMetricsIngestionRequest request) {
        SystemMetricDto metricDto = systemMetricsService.ingestMetrics(request);
        return ResponseEntity.ok(ApiResponse.success("Metrics ingested successfully", metricDto));
    }

    @GetMapping("/history/{computerId}")
    @Operation(summary = "Get Metric History", description = "Retrieve historical telemetry metric samples for a specific computer")
    public ResponseEntity<ApiResponse<List<SystemMetricDto>>> getMetricHistory(
            @PathVariable String computerId,
            @RequestParam(defaultValue = "30") int limit) {
        List<SystemMetricDto> history = systemMetricsService.getMetricHistory(computerId, limit);
        return ResponseEntity.ok(ApiResponse.success("Metric history fetched successfully", history));
    }
}
