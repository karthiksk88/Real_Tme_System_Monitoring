package com.neurosys.backend.controller;

import com.neurosys.backend.dto.request.DiagnosticEventDto;
import com.neurosys.backend.dto.response.AIDiagnosisReportDto;
import com.neurosys.backend.dto.response.AIPredictionDto;
import com.neurosys.backend.dto.response.AISystemHealthSummaryDto;
import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.service.DiagnosisEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class DiagnosisController {

    private final DiagnosisEngineService diagnosisEngineService;

    @GetMapping("/computers/{computerId}/diagnosis")
    public ResponseEntity<ApiResponse<AIDiagnosisReportDto>> getComputerDiagnosis(@PathVariable String computerId) {
        AIDiagnosisReportDto report = diagnosisEngineService.evaluateDiagnosis(computerId);
        return ResponseEntity.ok(ApiResponse.success("AI Diagnosis evaluated successfully", report));
    }

    @GetMapping("/computers/{computerId}/prediction")
    public ResponseEntity<ApiResponse<AIPredictionDto>> getComputerPrediction(@PathVariable String computerId) {
        AIPredictionDto prediction = diagnosisEngineService.evaluatePrediction(computerId);
        return ResponseEntity.ok(ApiResponse.success("AI Prediction evaluated successfully", prediction));
    }

    @GetMapping("/analytics/ai-summary")
    public ResponseEntity<ApiResponse<AISystemHealthSummaryDto>> getAISystemHealthSummary() {
        AISystemHealthSummaryDto summary = diagnosisEngineService.getSystemHealthSummary();
        return ResponseEntity.ok(ApiResponse.success("AI System Health summary fetched successfully", summary));
    }

    @PostMapping("/agent/events")
    public ResponseEntity<ApiResponse<String>> ingestAgentDiagnosticEvents(
            @RequestParam String agentId,
            @RequestBody List<DiagnosticEventDto> events) {
        diagnosisEngineService.recordAgentEvents(agentId, events);
        return ResponseEntity.ok(ApiResponse.success("Diagnostic events recorded successfully", "PROCESSED"));
    }
}
