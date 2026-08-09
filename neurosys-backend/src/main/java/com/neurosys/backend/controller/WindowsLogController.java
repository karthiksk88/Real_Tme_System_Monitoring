package com.neurosys.backend.controller;

import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.dto.response.LogAnalysisDto;
import com.neurosys.backend.service.LogHumanizerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/computers/{computerId}/logs")
@RequiredArgsConstructor
@Tag(name = "Windows Log Analyzer Endpoint", description = "REST API reading Windows Event logs, converting technical errors into plain English, and providing solutions")
public class WindowsLogController {

    private final LogHumanizerService logHumanizerService;

    @GetMapping
    @Operation(summary = "Get Humanized Windows Event Logs", description = "Retrieve Windows Event Logs translated into plain English with step-by-step remediation advice")
    public ResponseEntity<ApiResponse<Page<LogAnalysisDto>>> getComputerLogs(
            @PathVariable String computerId,
            @RequestParam(required = false) String logLevel,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size) {
        Page<LogAnalysisDto> logs = logHumanizerService.getComputerLogs(computerId, logLevel, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Event logs fetched successfully", logs));
    }
}
