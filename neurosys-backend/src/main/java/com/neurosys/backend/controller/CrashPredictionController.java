package com.neurosys.backend.controller;

import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.dto.response.CrashPredictionResponse;
import com.neurosys.backend.service.CrashPredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/predictions/crash")
@RequiredArgsConstructor
@Tag(name = "Crash Prediction Engine", description = "REST API for AI crash probability, risk confidence, diagnostic reasons, and remediation recommendations")
public class CrashPredictionController {

    private final CrashPredictionService crashPredictionService;

    @GetMapping("/{computerId}")
    @Operation(summary = "Get Crash Prediction", description = "Retrieve latest AI crash prediction risk analysis and diagnostic recommendations")
    public ResponseEntity<ApiResponse<CrashPredictionResponse>> getCrashPrediction(@PathVariable String computerId) {
        CrashPredictionResponse response = crashPredictionService.getLatestCrashPrediction(computerId);
        return ResponseEntity.ok(ApiResponse.success("Crash prediction analysis fetched successfully", response));
    }

    @PostMapping("/{computerId}/evaluate")
    @Operation(summary = "Evaluate On-Demand Crash Risk", description = "Trigger real-time Crash Prediction Engine calculation for a computer")
    public ResponseEntity<ApiResponse<CrashPredictionResponse>> evaluateCrashRisk(@PathVariable String computerId) {
        CrashPredictionResponse response = crashPredictionService.evaluateCrashRisk(computerId);
        return ResponseEntity.ok(ApiResponse.success("Crash risk evaluation completed", response));
    }
}
