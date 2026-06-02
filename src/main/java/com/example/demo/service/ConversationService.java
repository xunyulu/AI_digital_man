package com.example.demo.service;

import com.example.demo.dto.response.ConversationSummary;
import com.example.demo.dto.response.MessageResponse;
import com.example.demo.entity.*;
import com.example.demo.repository.*;
import com.example.demo.service.ai.AIService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final AttractionRepository attractionRepository;
    private final AIService aiService;
    private final com.example.demo.service.ai.TTSService ttsService;

    @Transactional
    public Conversation startConversation(Tourist tourist, Long attractionId) {
        Conversation conversation = Conversation.builder()
                .tourist(tourist)
                .status("ACTIVE")
                .build();

        if (attractionId != null) {
            Attraction attraction = attractionRepository.findById(attractionId)
                    .orElseThrow(() -> new RuntimeException("景点不存在"));
            conversation.setAttraction(attraction);
        }

        return conversationRepository.save(conversation);
    }

    @Transactional
    public Message sendTextMessage(Long conversationId, String text) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("对话不存在"));

        // Save user message
        Message userMessage = Message.builder()
                .conversation(conversation)
                .role("user")
                .content(text)
                .messageType("text")
                .build();
        messageRepository.save(userMessage);

        // Get conversation history
        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        // Call AI
        String aiReply = aiService.chat(conversation, history);

        // Save assistant message
        Message assistantMessage = Message.builder()
                .conversation(conversation)
                .role("assistant")
                .content(aiReply)
                .messageType("text")
                .build();
        messageRepository.save(assistantMessage);

        conversation.setUpdatedAt(java.time.LocalDateTime.now());
        conversationRepository.save(conversation);

        return assistantMessage;
    }

    @Transactional
    public Flux<String> sendTextMessageStream(Long conversationId, String text) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("对话不存在"));

        // Pre-load lazy associations before transaction closes
        if (conversation.getAttraction() != null) {
            conversation.getAttraction().getScenicSpot().getName();
        }

        // Save user message
        Message userMessage = Message.builder()
                .conversation(conversation)
                .role("user")
                .content(text)
                .messageType("text")
                .build();
        messageRepository.save(userMessage);

        List<Message> history = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);

        StringBuilder fullReply = new StringBuilder();
        return aiService.chatStreamWithTools(conversation, history)
                .doOnNext(fullReply::append)
                .doFinally(signal -> saveAssistantMessage(conversationId, fullReply.toString()));
    }

    @Transactional
    public void saveAssistantMessage(Long conversationId, String replyContent) {
        if (replyContent.isEmpty()) return;
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("对话不存在"));

        String messageType = "text";
        String audioUrl = null;

        try {
            byte[] audioBytes = ttsService.synthesize(replyContent);
            String fileName = "msg_" + System.currentTimeMillis() + ".mp3";
            java.nio.file.Path audioPath = java.nio.file.Paths.get("audio", fileName);
            java.nio.file.Files.write(audioPath, audioBytes);
            audioUrl = "/audio/" + fileName;
            messageType = "multimodal";
        } catch (Exception e) {
            // TTS failure shouldn't block the text response
        }

        Message assistantMessage = Message.builder()
                .conversation(conversation)
                .role("assistant")
                .content(replyContent)
                .messageType(messageType)
                .audioUrl(audioUrl)
                .build();
        messageRepository.save(assistantMessage);
        conversation.setUpdatedAt(java.time.LocalDateTime.now());
        conversationRepository.save(conversation);
    }

    public List<ConversationSummary> getConversationsByDeviceId(String deviceId) {
        // Tourist should be looked up first
        return List.of(); // Will be implemented properly
    }

    @Transactional(readOnly = true)
    public List<ConversationSummary> getConversationsByTourist(Tourist tourist) {
        List<Conversation> conversations = conversationRepository.findByTouristIdOrderByUpdatedAtDesc(tourist.getId());

        return conversations.stream().map(conv -> {
            List<Message> messages = messageRepository.findByConversationIdOrderByCreatedAtAsc(conv.getId());
            String lastMsg = messages.isEmpty() ? "" : messages.get(messages.size() - 1).getContent();
            if (lastMsg.length() > 50) {
                lastMsg = lastMsg.substring(0, 50) + "...";
            }

            return ConversationSummary.builder()
                    .id(conv.getId())
                    .attractionName(conv.getAttraction() != null ? conv.getAttraction().getName() : null)
                    .lastMessage(lastMsg)
                    .status(conv.getStatus())
                    .updatedAt(conv.getUpdatedAt())
                    .build();
        }).collect(Collectors.toList());
    }

    public List<MessageResponse> getMessages(Long conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId)
                .stream()
                .map(msg -> MessageResponse.builder()
                        .id(msg.getId())
                        .role(msg.getRole())
                        .content(msg.getContent())
                        .audioUrl(msg.getAudioUrl())
                        .messageType(msg.getMessageType())
                        .createdAt(msg.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
