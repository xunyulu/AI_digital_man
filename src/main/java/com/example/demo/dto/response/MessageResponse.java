package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class MessageResponse {
    private Long id;
    private String role;
    private String content;
    private String audioUrl;
    private String messageType;
    private LocalDateTime createdAt;
}
