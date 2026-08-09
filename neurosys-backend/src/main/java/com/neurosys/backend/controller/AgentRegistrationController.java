package com.neurosys.backend.controller;

import com.neurosys.backend.dto.request.AgentRegistrationRequest;
import com.neurosys.backend.dto.response.AgentRegistrationResponse;
import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.service.AgentRegistrationService;
import com.neurosys.backend.service.ComputerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/v1/agent", "/api/agent"})
@RequiredArgsConstructor
@Tag(name = "Agent Registration Endpoint", description = "REST API for OSHI Monitoring Agent initial registration, status polling, and heartbeat authorization")
public class AgentRegistrationController {

    private final AgentRegistrationService agentRegistrationService;
    private final ComputerService computerService;

    @PostMapping("/register")
    @Operation(summary = "Register Monitoring Agent", description = "Register a computer endpoint on agent startup, save hardware specs, and return authentication token")
    public ResponseEntity<ApiResponse<AgentRegistrationResponse>> registerAgent(@Valid @RequestBody AgentRegistrationRequest request) {
        AgentRegistrationResponse response = agentRegistrationService.registerAgent(request);
        return ResponseEntity.ok(ApiResponse.success("Agent registered successfully", response));
    }

    @GetMapping("/status/{agentId}")
    @Operation(summary = "Get Agent Approval Status", description = "Poll onboarding approval status (PENDING, ONLINE, REJECTED) for a registered agent")
    public ResponseEntity<ApiResponse<String>> getAgentStatus(@PathVariable String agentId) {
        String status = computerService.getAgentStatus(agentId);
        return ResponseEntity.ok(ApiResponse.success("Agent status retrieved", status));
    }
}
