package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.HealthScoreDto;
import com.neurosys.backend.entity.Computer;
import com.neurosys.backend.entity.SystemMetric;

public interface HealthScoreEngine {
    HealthScoreDto calculateAndSaveHealthScore(Computer computer, SystemMetric metric, Double crashProbability);
    HealthScoreDto getLatestHealthScore(String computerId);
}
