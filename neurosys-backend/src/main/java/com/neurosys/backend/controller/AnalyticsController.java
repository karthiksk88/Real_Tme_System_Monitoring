package com.neurosys.backend.controller;

import com.neurosys.backend.dto.response.AnalyticsSummaryDto;
import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@RequiredArgsConstructor
@Tag(name = "Analytics Dashboard Endpoint", description = "REST API delivering executive fleet telemetry, Top Busy/Healthy computer leaderboards, and alert statistics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    @Operation(summary = "Get Analytics Dashboard Summary", description = "Retrieve fleet summary tiles, Top Busy/Healthy computer cards, prediction summary, and alert breakdown")
    public ResponseEntity<ApiResponse<AnalyticsSummaryDto>> getAnalyticsSummary() {
        AnalyticsSummaryDto summary = analyticsService.getExecutiveAnalyticsSummary();
        return ResponseEntity.ok(ApiResponse.success("Analytics summary fetched successfully", summary));
    }
}
