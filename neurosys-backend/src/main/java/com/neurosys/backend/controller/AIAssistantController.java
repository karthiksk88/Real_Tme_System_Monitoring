package com.neurosys.backend.controller;

import com.neurosys.backend.dto.request.ChatMessageRequest;
import com.neurosys.backend.dto.response.ApiResponse;
import com.neurosys.backend.dto.response.ChatMessageResponse;
import com.neurosys.backend.service.AIAssistantService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai-assistant")
@RequiredArgsConstructor
@Tag(name = "AI Assistant Endpoint", description = "REST API for natural language monitoring assistant queries using live computer telemetry")
public class AIAssistantController {

    private final AIAssistantService aiAssistantService;

    @PostMapping("/chat")
    @Operation(summary = "Ask AI Assistant Query", description = "Ask natural language questions about system health, slowness root cause, offline endpoints, or error explanations")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> chatWithAssistant(@Valid @RequestBody ChatMessageRequest request) {
        ChatMessageResponse response = aiAssistantService.processUserQuery(request);
        return ResponseEntity.ok(ApiResponse.success("AI assistant response generated", response));
    }
}
