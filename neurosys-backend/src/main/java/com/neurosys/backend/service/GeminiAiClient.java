package com.neurosys.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class GeminiAiClient {

    @Value("${neurosys.ai.gemini.api-key:}")
    private String apiKey;

    @Value("${neurosys.ai.gemini.model:gemini-2.5-flash}")
    private String model = "gemini-2.5-flash";

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiAiClient() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(6000);
        factory.setReadTimeout(12000);
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
                You are NeuroSys AI Copilot, a helpful, highly intelligent AI assistant and IT infrastructure analyst.

                CORE BEHAVIOR RULES:
                1. MULTILINGUAL SUPPORT: You MUST understand and respond fluently in whatever language the user communicates in (e.g., English, Kannada, Hindi, Tamil, Telugu, Spanish, French, German, etc.).
                2. UNIVERSAL ANSWERS: Answer ANY question, greeting, general knowledge topic, programming request, or troubleshooting problem clearly, politely, and meaningfully.
                3. TELEMETRY INTEGRATION: When the user asks about computers, system health, offline endpoints, or software in the monitored lab fleet, reference the following live system telemetry snapshot:

                LIVE SYSTEM TELEMETRY SNAPSHOT:
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
        } catch (HttpStatusCodeException e) {
            log.error("Google Gemini API HTTP Error status {}: {}", e.getStatusCode(), e.getResponseBodyAsString());
            if (e.getStatusCode().is4xxClientError()) {
                return "⚠️ **Google Gemini API Key Required:** The configured API key was revoked or is invalid. Please get a new key from [Google AI Studio](https://aistudio.google.com/app/apikey) and set `GEMINI_API_KEY` in Railway environment variables or type `key: <YOUR_NEW_API_KEY>` directly in chat.";
            }
            return null;
        } catch (Exception e) {
            log.error("Failed to call Google Gemini REST API model {}", targetModel, e);
            return null;
        }
    }
}
