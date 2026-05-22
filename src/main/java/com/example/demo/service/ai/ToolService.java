package com.example.demo.service.ai;

import com.example.demo.service.MapQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Service
public class ToolService {

    private final MapQueryService mapQueryService;
    private final WebClient webClient;

    @Value("${DASHSCOPE_API_KEY:}")
    private String apiKey;

    @Value("${ai.model.name:qwen3.5-omni-plus}")
    private String modelName;

    private static final String BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

    public ToolService(MapQueryService mapQueryService) {
        this.mapQueryService = mapQueryService;
        this.webClient = WebClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String execute(String toolName, Map<String, Object> arguments) {
        return switch (toolName) {
            case "search_web" -> searchWeb((String) arguments.get("query"));
            case "query_map" -> queryMap(
                    (String) arguments.get("origin"),
                    (String) arguments.get("destination"));
            default -> "未知工具: " + toolName;
        };
    }

    private String searchWeb(String query) {
        try {
            Map<String, Object> body = new java.util.LinkedHashMap<>();
            body.put("model", modelName);
            body.put("messages", List.of(Map.of("role", "user", "content",
                    "请搜索以下信息并简要回答（200字以内）：" + query)));
            body.put("stream", false);
            body.put("enable_search", true);

            String response = webClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null) return "搜索未返回结果";

            // Extract content from response
            int contentIdx = response.indexOf("\"content\"");
            if (contentIdx == -1) return "搜索未返回结果";
            int colonIdx = response.indexOf(":", contentIdx);
            int startQuote = response.indexOf("\"", colonIdx + 1);
            int endQuote = response.indexOf("\"", startQuote + 1);
            if (startQuote == -1 || endQuote == -1) return "搜索未返回结果";
            return response.substring(startQuote + 1, endQuote);
        } catch (Exception e) {
            return "搜索失败: " + e.getMessage();
        }
    }

    private String queryMap(String origin, String destination) {
        return mapQueryService.queryRoute(origin, destination);
    }
}
