package com.neurosys.backend.controller;

import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.dto.response.ProcessMonitoringResponse;
import com.neurosys.backend.service.ProcessMonitoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/computers/{computerId}/processes")
@RequiredArgsConstructor
@Tag(name = "Process Monitoring Endpoint", description = "REST API for running process analysis, Top CPU/RAM consumers, search, column sorting, and pagination")
public class ProcessMonitoringController {

    private final ProcessMonitoringService processMonitoringService;

    @GetMapping
    @Operation(summary = "Get Computer Processes", description = "Retrieve list of running processes for a computer with search, sorting, and pagination")
    public ResponseEntity<ApiResponse<ProcessMonitoringResponse>> getComputerProcesses(
            @PathVariable String computerId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "cpu") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        ProcessMonitoringResponse response = processMonitoringService.getComputerProcesses(computerId, search, sortBy, sortOrder, page, size);
        return ResponseEntity.ok(ApiResponse.success("Process list fetched successfully", response));
    }
}
