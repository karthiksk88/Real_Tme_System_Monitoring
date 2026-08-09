package com.neurosys.backend.service;

import com.neurosys.backend.dto.response.AnalyticsSummaryDto;

public interface AnalyticsService {
    AnalyticsSummaryDto getExecutiveAnalyticsSummary();
}
