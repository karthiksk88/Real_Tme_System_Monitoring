package com.neurosys.backend.controller;

import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.dto.response.HealthScoreDto;
import com.neurosys.backend.service.HealthScoreEngine;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/health-score")
@RequiredArgsConstructor
@Tag(name = "Health Score Engine", description = "REST API for calculating and retrieving 0-100 system health scores")
public class HealthScoreController {

    private final HealthScoreEngine healthScoreEngine;

    @GetMapping("/{computerId}")
    @Operation(summary = "Get Current Health Score", description = "Retrieve current calculated 0-100 Health Score and component breakdown for a computer")
    public ResponseEntity<ApiResponse<HealthScoreDto>> getHealthScore(@PathVariable String computerId) {
        HealthScoreDto score = healthScoreEngine.getLatestHealthScore(computerId);
        return ResponseEntity.ok(ApiResponse.success("Health score fetched successfully", score));
    }
}
