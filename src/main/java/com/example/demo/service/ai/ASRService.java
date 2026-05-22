package com.example.demo.service.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class ASRService {

    private final WebClient webClient;

    @Value("${DASHSCOPE_API_KEY:}")
    private String apiKey;

    private static final String BASE_URL = "https://dashscope.aliyuncs.com";

    public ASRService() {
        this.webClient = WebClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String recognize(byte[] audioBytes, String format) {
        try {
            String base64Audio = Base64.getEncoder().encodeToString(audioBytes);

            Map<String, Object> input = new HashMap<>();
            input.put("audio", base64Audio);

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("format", format != null ? format : "webm");

            Map<String, Object> body = new HashMap<>();
            body.put("model", "paraformer-v2");
            body.put("input", input);
            body.put("parameters", parameters);

            String response = webClient.post()
                    .uri("/api/v1/services/aigc/speech-recognition/paraformer-v2")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null) {
                throw new RuntimeException("ASR response is null");
            }

            // Extract recognized text
            String text = extractJsonString(response, "\"text\"");
            if (text != null && !text.isEmpty()) {
                return text;
            }

            throw new RuntimeException("No text in ASR response: " + response);
        } catch (Exception e) {
            throw new RuntimeException("ASR recognition failed: " + e.getMessage(), e);
        }
    }

    private String extractJsonString(String json, String key) {
        int keyIdx = json.indexOf(key);
        if (keyIdx == -1) return null;
        int colonIdx = json.indexOf(":", keyIdx);
        if (colonIdx == -1) return null;
        int startQuote = json.indexOf("\"", colonIdx + 1);
        if (startQuote == -1) return null;
        int endQuote = json.indexOf("\"", startQuote + 1);
        if (endQuote == -1) return null;
        return json.substring(startQuote + 1, endQuote);
    }
}
