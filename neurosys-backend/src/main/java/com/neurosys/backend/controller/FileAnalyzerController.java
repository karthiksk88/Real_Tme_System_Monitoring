package com.neurosys.backend.controller;

import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.dto.response.FileAnalysisReportDto;
import com.neurosys.backend.service.FileAnalyzerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/computers/{computerId}/file-analyzer")
@RequiredArgsConstructor
@Tag(name = "File Analyzer Endpoint", description = "REST API scanning duplicate files, large files, temp/junk files, storage breakdown, and optimization recommendations")
public class FileAnalyzerController {

    private final FileAnalyzerService fileAnalyzerService;

    @GetMapping("/summary")
    @Operation(summary = "Get Storage Analysis & Suggestions", description = "Retrieve storage breakdown by file type, duplicate file counts, and optimization recommendations")
    public ResponseEntity<ApiResponse<FileAnalysisReportDto>> getStorageAnalysis(@PathVariable String computerId) {
        FileAnalysisReportDto report = fileAnalyzerService.scanComputerFiles(computerId);
        return ResponseEntity.ok(ApiResponse.success("File analysis report generated successfully", report));
    }
}
