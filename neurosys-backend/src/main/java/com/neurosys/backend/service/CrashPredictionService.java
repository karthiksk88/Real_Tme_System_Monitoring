package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.CrashPredictionResponse;

public interface CrashPredictionService {
    CrashPredictionResponse evaluateCrashRisk(String computerId);
    CrashPredictionResponse getLatestCrashPrediction(String computerId);
}
