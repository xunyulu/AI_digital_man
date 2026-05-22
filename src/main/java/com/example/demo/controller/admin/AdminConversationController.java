package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.MessageResponse;
import com.example.demo.entity.Conversation;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminConversationController {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    @GetMapping("/conversations")
    public ApiResponse<Page<Conversation>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(
                conversationRepository.findAllByOrderByUpdatedAtDesc(PageRequest.of(page, size)));
    }

    @GetMapping("/conversations/{id}")
    public ApiResponse<List<MessageResponse>> detail(@PathVariable Long id) {
        List<MessageResponse> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(id)
                .stream()
                .map(m -> MessageResponse.builder()
                        .id(m.getId())
                        .role(m.getRole())
                        .content(m.getContent())
                        .audioUrl(m.getAudioUrl())
                        .messageType(m.getMessageType())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
        return ApiResponse.success(messages);
    }
}
