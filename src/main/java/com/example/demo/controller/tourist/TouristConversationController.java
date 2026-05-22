package com.example.demo.controller.tourist;

import com.example.demo.dto.request.SendTextRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.ConversationSummary;
import com.example.demo.dto.response.MessageResponse;
import com.example.demo.entity.Conversation;
import com.example.demo.entity.Message;
import com.example.demo.entity.Tourist;
import com.example.demo.service.ConversationService;
import com.example.demo.service.TouristService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/api/tourist")
@RequiredArgsConstructor
public class TouristConversationController {

    private final TouristService touristService;
    private final ConversationService conversationService;
    private final com.example.demo.service.ai.ASRService asrService;

    @PostMapping("/conversation/start")
    public ApiResponse<Long> startConversation(
            @RequestParam String deviceId,
            @RequestParam(required = false) Long attractionId) {
        Tourist tourist = touristService.findOrCreateByDeviceId(deviceId);
        Conversation conversation = conversationService.startConversation(tourist, attractionId);
        return ApiResponse.success(conversation.getId());
    }

    @PostMapping("/conversation/{id}/message/text")
    public ApiResponse<MessageResponse> sendText(@PathVariable Long id, @RequestBody SendTextRequest request) {
        Message msg = conversationService.sendTextMessage(id, request.getText());
        MessageResponse resp = MessageResponse.builder()
                .id(msg.getId())
                .role(msg.getRole())
                .content(msg.getContent())
                .audioUrl(msg.getAudioUrl())
                .messageType(msg.getMessageType())
                .createdAt(msg.getCreatedAt())
                .build();
        return ApiResponse.success(resp);
    }

    @PostMapping(value = "/conversation/{id}/message/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> sendTextStream(@PathVariable Long id, @RequestBody SendTextRequest request) {
        return conversationService.sendTextMessageStream(id, request.getText());
    }

    @GetMapping("/conversation/{id}/messages")
    public ApiResponse<List<MessageResponse>> getMessages(@PathVariable Long id) {
        return ApiResponse.success(conversationService.getMessages(id));
    }

    @PostMapping("/conversation/voice/recognize")
    public ApiResponse<String> recognizeVoice(@RequestParam("audio") org.springframework.web.multipart.MultipartFile audio) {
        try {
            byte[] audioBytes = audio.getBytes();
            String format = audio.getOriginalFilename() != null
                    && audio.getOriginalFilename().endsWith(".webm") ? "webm" : "wav";
            String text = asrService.recognize(audioBytes, format);
            return ApiResponse.success(text);
        } catch (Exception e) {
            return ApiResponse.error(500, "语音识别失败: " + e.getMessage());
        }
    }

    @GetMapping("/conversations")
    public ApiResponse<List<ConversationSummary>> getConversations(@RequestParam String deviceId) {
        Tourist tourist = touristService.findOrCreateByDeviceId(deviceId);
        return ApiResponse.success(conversationService.getConversationsByTourist(tourist));
    }
}
