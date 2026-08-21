package com.neurosys.backend.service;

import com.neurosys.backend.dto.request.DiagnosticEventDto;
import com.neurosys.backend.dto.response.AIDiagnosisReportDto;
import com.neurosys.backend.dto.response.AIPredictionDto;
import com.neurosys.backend.dto.response.AISystemHealthSummaryDto;

import java.util.List;

public interface DiagnosisEngineService {
    AIDiagnosisReportDto evaluateDiagnosis(String computerId);
    AIPredictionDto evaluatePrediction(String computerId);
    void recordAgentEvents(String agentId, List<DiagnosticEventDto> events);
    AISystemHealthSummaryDto getSystemHealthSummary();
    void processMetricsForIncidents(String computerId);
}
