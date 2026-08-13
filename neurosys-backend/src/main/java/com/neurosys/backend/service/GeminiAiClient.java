package com.neurosys.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GeminiAiClient {

    @Value("${neurosys.ai.gemini.api-key:AIzaSyDNyvwGXCZJbAsrLAadlu7GBkztFZj6iHY}")
    private String apiKey = "AIzaSyDNyvwGXCZJbAsrLAadlu7GBkztFZj6iHY";

    @Value("${neurosys.ai.gemini.model:gemini-2.5-flash}")
    private String model = "gemini-2.5-flash";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiAiClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(6000);
        factory.setReadTimeout(10000);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty() && !apiKey.contains("YOUR_GEMINI_API_KEY");
    }

    public void setApiKey(String key) {
        if (key != null && !key.trim().isEmpty()) {
            this.apiKey = key.trim();
        }
    }

    public String generateResponse(String systemContext, String userQuery) {
        if (!isConfigured()) {
            return null;
        }

        String targetModel = (model != null && !model.trim().isEmpty()) ? model.trim() : "gemini-2.5-flash";
        String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", targetModel, apiKey);

        String promptText = String.format("""
                SYSTEM INSTRUCTIONS:
                You are NeuroSys AI Copilot, an expert IT infrastructure monitor and predictive analyst.
                Answer the user's question clearly, concisely, and accurately based strictly on the following live computer fleet telemetry data context.
                Provide bullet points and actionable IT optimization recommendations where relevant.

                LIVE SYSTEM TELEMETRY CONTEXT:
                %s

                USER QUESTION:
                %s
                """, systemContext, userQuery);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(Map.of("text", promptText)))
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        try {
            HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(requestBody), headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List candidates = (List) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map candidate = (Map) candidates.get(0);
                    Map content = (Map) candidate.get("content");
                    if (content != null) {
                        List parts = (List) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            Map part = (Map) parts.get(0);
                            return (String) part.get("text");
                        }
                    }
                }
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to call Google Gemini REST API model {}", targetModel, e);
            return null;
        }
    }
}
