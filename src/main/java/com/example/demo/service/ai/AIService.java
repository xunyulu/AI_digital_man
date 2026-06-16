package com.example.demo.service.ai;

import com.example.demo.entity.Attraction;
import com.example.demo.entity.Conversation;
import com.example.demo.entity.Message;
import com.example.demo.entity.ScenicSpot;
import com.example.demo.repository.ScenicSpotRepository;
import com.example.demo.service.SystemConfigService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

import java.util.*;

@Service
public class AIService {

    private final WebClient webClient;
    private final KnowledgeService knowledgeService;
    private final ToolService toolService;
    private final SystemConfigService configService;
    private final ScenicSpotRepository scenicSpotRepository;

    @Value("${DASHSCOPE_API_KEY:}")
    private String apiKey;

    @Value("${ai.model.name:qwen3.5-omni-plus}")
    private String modelName;

    private static final String BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

    private static final List<Map<String, Object>> TOOLS = List.of(
        Map.of(
            "type", "function",
            "function", Map.of(
                "name", "search_web",
                "description", "搜索互联网获取实时信息，如天气、活动、新闻等。当游客询问最新信息、实时动态时使用。",
                "parameters", Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "query", Map.of("type", "string", "description", "搜索关键词")
                    ),
                    "required", List.of("query")
                )
            )
        ),
        Map.of(
            "type", "function",
            "function", Map.of(
                "name", "query_map",
                "description", "查询两个景点之间的距离和步行时间。当游客询问路线、距离、怎么走时使用。",
                "parameters", Map.of(
                    "type", "object",
                    "properties", Map.of(
                        "origin", Map.of("type", "string", "description", "起点景点名称"),
                        "destination", Map.of("type", "string", "description", "终点景点名称")
                    ),
                    "required", List.of("origin", "destination")
                )
            )
        )
    );

    public AIService(KnowledgeService knowledgeService, ToolService toolService,
                     SystemConfigService configService, ScenicSpotRepository scenicSpotRepository) {
        this.knowledgeService = knowledgeService;
        this.toolService = toolService;
        this.configService = configService;
        this.scenicSpotRepository = scenicSpotRepository;
        this.webClient = WebClient.builder()
                .baseUrl(BASE_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public String chat(Conversation conversation, List<Message> history) {
        Map<String, Object> requestBody = buildRequestBody(conversation, history);

        try {
            String fullResponse = webClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToFlux(String.class)
                    .collectList()
                    .map(list -> String.join("", list))
                    .block();

            if (fullResponse == null) return "抱歉，我现在无法回答，请稍后再试。";
            return extractAllContent(fullResponse);
        } catch (Exception e) {
            return "抱歉，我现在无法回答，请稍后再试。";
        }
    }

    public Flux<String> chatStream(Conversation conversation, List<Message> history) {
        Map<String, Object> requestBody = buildRequestBody(conversation, history);

        return webClient.post()
                .uri("/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .bodyValue(requestBody)
                .retrieve()
                .bodyToFlux(String.class)
                .map(this::extractContent)
                .filter(Objects::nonNull);
    }

    private String extractAllContent(String raw) {
        StringBuilder result = new StringBuilder();
        int pos = 0;
        while (true) {
            int deltaIdx = raw.indexOf("\"delta\"", pos);
            if (deltaIdx == -1) break;
            String content = extractContent(raw, deltaIdx);
            if (content != null && !content.isEmpty()) result.append(content);
            pos = deltaIdx + 7; // move past "\"delta\""
        }
        return !result.isEmpty() ? result.toString() : "抱歉，我现在无法回答，请稍后再试。";
    }

    private String extractContent(String chunk) {
        return extractContent(chunk, 0);
    }

    private String extractContent(String chunk, int fromIndex) {
        int deltaIdx = chunk.indexOf("\"delta\"", fromIndex);
        if (deltaIdx == -1) return null;
        int contentKeyIdx = chunk.indexOf("\"content\"", deltaIdx);
        if (contentKeyIdx == -1) return null;
        int colonIdx = chunk.indexOf(":", contentKeyIdx);
        if (colonIdx == -1) return null;
        int startQuote = chunk.indexOf("\"", colonIdx + 1);
        if (startQuote == -1) return null;
        int endQuote = chunk.indexOf("\"", startQuote + 1);
        if (endQuote == -1) return null;

        String content = chunk.substring(startQuote + 1, endQuote);
        return content.replace("\\n", "\n").replace("\\\"", "\"").replace("\\\\", "\\");
    }

    private Map<String, Object> buildRequestBody(Conversation conversation, List<Message> history) {
        return buildRequestBody(conversation, history, true, false);
    }

    private Map<String, Object> buildRequestBody(Conversation conversation, List<Message> history,
                                                  boolean stream, boolean includeTools) {
        List<Map<String, String>> messages = new ArrayList<>();

        String systemPrompt = buildSystemPrompt(conversation);
        messages.add(Map.of("role", "system", "content", systemPrompt));

        int start = Math.max(0, history.size() - 20);
        for (int i = start; i < history.size(); i++) {
            Message msg = history.get(i);
            messages.add(Map.of("role", msg.getRole(), "content",
                    msg.getContent() != null ? msg.getContent() : ""));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("model", modelName);
        body.put("messages", messages);
        body.put("stream", stream);
        body.put("modalities", List.of("text"));
        if (stream) {
            body.put("stream_options", Map.of("include_usage", true));
        }
        if (includeTools) {
            body.put("tools", TOOLS);
            body.put("tool_choice", "auto");
        }
        return body;
    }

    public Flux<String> chatStreamWithTools(Conversation conversation, List<Message> history) {
        // Step 1: Non-streaming call to detect tool calls
        Map<String, Object> requestBody = buildRequestBody(conversation, history, false, true);

        try {
            String response = webClient.post()
                    .uri("/chat/completions")
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

            if (response == null) {
                return chatStream(conversation, history);
            }

            List<Map<String, String>> toolCalls = extractToolCalls(response);
            if (toolCalls.isEmpty()) {
                // No tool calls, use normal streaming
                return chatStream(conversation, history);
            }

            // Step 2: Execute tools and append results to messages
            List<Message> extendedHistory = new ArrayList<>(history);
            for (Map<String, String> tc : toolCalls) {
                String toolName = tc.get("name");
                String argsJson = tc.get("arguments");
                Map<String, Object> args = parseArguments(argsJson);

                String result = toolService.execute(toolName, args);

                // Add tool result as a system message to history
                extendedHistory.add(Message.builder()
                        .role("system")
                        .content("[" + toolName + "结果] " + result)
                        .messageType("system")
                        .build());
            }

            // Step 3: Make a streaming call with tool results in context
            return chatStream(conversation, extendedHistory);
        } catch (Exception e) {
            return chatStream(conversation, history);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseArguments(String argsJson) {
        Map<String, Object> args = new java.util.HashMap<>();
        // Simple JSON arg parser (avoid Jackson dependency)
        if (argsJson == null || argsJson.isEmpty()) return args;
        // Handle {"key":"value","key2":"value2"} format
        String inner = argsJson.trim();
        if (inner.startsWith("{")) inner = inner.substring(1);
        if (inner.endsWith("}")) inner = inner.substring(0, inner.length() - 1);
        for (String pair : inner.split(",")) {
            int colonIdx = pair.indexOf(":");
            if (colonIdx == -1) continue;
            String key = pair.substring(0, colonIdx).trim().replaceAll("\"", "");
            String value = pair.substring(colonIdx + 1).trim().replaceAll("\"", "");
            args.put(key, value);
        }
        return args;
    }

    private List<Map<String, String>> extractToolCalls(String response) {
        List<Map<String, String>> toolCalls = new java.util.ArrayList<>();
        int pos = 0;
        while (true) {
            int tcIdx = response.indexOf("\"tool_calls\"", pos);
            if (tcIdx == -1) break;

            // Find function name
            int nameIdx = response.indexOf("\"name\"", tcIdx);
            if (nameIdx == -1) { pos = tcIdx + 12; continue; }
            int nameStart = response.indexOf("\"", nameIdx + 8);
            int nameEnd = response.indexOf("\"", nameStart + 1);
            if (nameStart == -1 || nameEnd == -1) { pos = tcIdx + 12; continue; }
            String name = response.substring(nameStart + 1, nameEnd);

            // Find arguments
            int argsIdx = response.indexOf("\"arguments\"", nameEnd);
            if (argsIdx == -1) { pos = tcIdx + 12; continue; }
            int argsStart = response.indexOf("\"", argsIdx + 13);
            if (argsStart == -1) { pos = tcIdx + 12; continue; }
            // Handle escaped quotes in JSON args
            StringBuilder argsBuilder = new StringBuilder();
            int i = argsStart + 1;
            int braceCount = 0;
            boolean foundStart = false;
            while (i < response.length()) {
                char c = response.charAt(i);
                if (c == '{') { foundStart = true; braceCount++; }
                else if (c == '}') { braceCount--; }
                if (c == '\\' && i + 1 < response.length()) {
                    i += 2;
                    continue;
                }
                argsBuilder.append(c);
                if (foundStart && braceCount == 0) break;
                i++;
            }
            String arguments = argsBuilder.toString().trim();

            Map<String, String> tc = new java.util.HashMap<>();
            tc.put("name", name);
            tc.put("arguments", arguments);
            toolCalls.add(tc);

            pos = i + 1;
            if (pos >= response.length()) break;
        }
        return toolCalls;
    }

    private String buildSystemPrompt(Conversation conversation) {
        Attraction attr = conversation.getAttraction();

        // 解析景区ID：优先从对话关联的景点获取，回退到管理员设置的活跃景区
        Long scenicSpotId = null;
        String scenicName = "景区";
        String attractionName = "";
        Long attractionId = null;

        if (attr != null) {
            scenicSpotId = attr.getScenicSpot().getId();
            scenicName = attr.getScenicSpot().getName();
            attractionName = attr.getName();
            attractionId = attr.getId();
        } else {
            // 对话没有关联景点，使用管理员设置的活跃景区
            scenicSpotId = configService.getActiveScenicSpotId();
            if (scenicSpotId != null) {
                ScenicSpot activeSpot = scenicSpotRepository.findById(scenicSpotId).orElse(null);
                if (activeSpot != null) {
                    scenicName = activeSpot.getName();
                }
            }
        }

        // 从数据库读取导游名配置（支持景区覆盖）
        String guideName = configService.getConfigValue(scenicSpotId, "guideName", "灵灵");

        // 加载知识库
        String knowledgeContext = knowledgeService.searchContext(scenicSpotId, attractionId, "");

        StringBuilder prompt = new StringBuilder();
        prompt.append("你是一位专业的景区AI导游，名字叫'").append(guideName)
                .append("'，性格热情友好、知识渊博。\n");
        prompt.append("你正在").append(scenicName).append("为游客提供导览服务");
        if (!attractionName.isEmpty()) {
            prompt.append("，当前游客正在游览").append(attractionName);
        }
        prompt.append("。\n\n");

        if (!knowledgeContext.isEmpty()) {
            prompt.append("以下是关于当前景点的背景知识：\n");
            prompt.append(knowledgeContext);
            prompt.append("\n");
        }

        prompt.append("请遵循以下规则：\n");
        prompt.append("1. 回复简洁生动，像真人导游一样自然交流，每次回复控制在200字以内\n");
        prompt.append("2. 涉及景点知识时确保准确，不编造信息\n");
        prompt.append("3. 适当引导游客关注景点的亮点和背后故事\n");
        prompt.append("4. 如游客问路/问设施，用query_map工具查询路线距离\n");
        prompt.append("5. 如游客问实时信息（天气、活动），用search_web工具搜索\n");
        prompt.append("6. 如果被问到与景区无关的问题，礼貌地引导回导览主题\n");

        return prompt.toString();
    }
}
