package com.neurosys.backend.controller;

import com.neurosys.backend.dto.request.SoftwareSyncRequest;
import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.service.SoftwareService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/agent")
@RequiredArgsConstructor
@Tag(name = "Agent Software Inventory Endpoint", description = "REST API for OSHI Monitoring Agent software scanning payload ingestion")
public class AgentSoftwareController {

    private final SoftwareService softwareService;

    @PostMapping({"/software", "/software-inventory"})
    @Operation(summary = "Sync Installed Software Payload", description = "Ingest scanned installed application inventory list from monitoring agent")
    public ResponseEntity<ApiResponse<java.util.Map<String, Object>>> syncSoftware(@Valid @RequestBody SoftwareSyncRequest request) {
        softwareService.syncSoftwareInventory(request);
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("agentId", request.getAgentId());
        result.put("softwareCount", request.getSoftwareList() != null ? request.getSoftwareList().size() : 0);
        result.put("status", "SUCCESS");
        result.put("syncedAt", java.time.Instant.now().toString());

        return ResponseEntity.ok(ApiResponse.success("Software inventory synchronized successfully", result));
    }
}
