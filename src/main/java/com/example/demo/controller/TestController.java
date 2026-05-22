package com.example.demo.controller;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.Conversation;
import com.example.demo.entity.Message;
import com.example.demo.service.ConversationService;
import com.example.demo.service.TouristService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class TestController {

    private final TouristService touristService;
    private final ConversationService conversationService;

    @GetMapping("/test/ai")
    public ApiResponse<Map<String, Object>> testAi(
            @RequestParam(defaultValue = "你好，请介绍一下这里有什么好玩的？") String q,
            @RequestParam(required = false) Long convId) {

        if (convId == null) {
            var tourist = touristService.findOrCreateByDeviceId("test-browser");
            Conversation conv = conversationService.startConversation(tourist, 1L);
            convId = conv.getId();
        }

        Message reply = conversationService.sendTextMessage(convId, q);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("conversationId", convId);
        data.put("reply", reply.getContent());
        return ApiResponse.success(data);
    }
}
