package com.example.demo.service.ai;

import com.example.demo.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Service
public class TTSService {

    private final WebClient webClient;
    private final SystemConfigService configService;

    @Value("${DASHSCOPE_API_KEY:}")
    private String apiKey;

    @Value("${tts.voice:longxiaochun}")
    private String voice;

    private static final String BASE_URL = "https://dashscope.aliyuncs.com";

    public TTSService(SystemConfigService configService) {
        this.configService = configService;
        this.webClient = WebClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public byte[] synthesize(String text) {
        return synthesize(text, (Long) null);
    }

    /**
     * 合成语音，根据景区读取对应的TTS语音配置
     * @param text 要合成的文本
     * @param scenicSpotId 景区ID，为null时使用默认语音
     */
    public byte[] synthesize(String text, Long scenicSpotId) {
        // 根据景区读取语音配置，回退到全局配置，再回退到 application.properties 默认值
        String effectiveVoice = configService.getConfigValue(scenicSpotId, "ttsVoice", this.voice);
        try {
            Map<String, Object> input = new HashMap<>();
            input.put("text", text);

            Map<String, Object> parameters = new HashMap<>();
            parameters.put("voice", effectiveVoice);
            parameters.put("format", "mp3");

            Map<String, Object> body = new HashMap<>();
            body.put("model", "cosyvoice-v1");
            body.put("input", input);
            body.put("parameters", parameters);

            String response = webClient.post()
                    .uri("/api/v1/services/aigc/multimodal-generation/generation")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null) {
                throw new RuntimeException("TTS response is null");
            }

            // Extract base64 audio data manually (same approach as AIService)
            String data = extractJsonString(response, "\"data\"");
            if (data != null && !data.isEmpty()) {
                return Base64.getDecoder().decode(data);
            }

            // Try audio URL
            String url = extractJsonString(response, "\"url\"");
            if (url != null && !url.isEmpty()) {
                return webClient.get()
                        .uri(url)
                        .retrieve()
                        .bodyToMono(byte[].class)
                        .block();
            }

            throw new RuntimeException("No audio data in TTS response: " + response);
        } catch (Exception e) {
            throw new RuntimeException("TTS synthesis failed: " + e.getMessage(), e);
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
        String value = json.substring(startQuote + 1, endQuote);
        return value.replace("\\n", "\n").replace("\\\"", "\"").replace("\\\\", "\\");
    }
}
