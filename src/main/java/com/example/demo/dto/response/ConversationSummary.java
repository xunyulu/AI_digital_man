package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class ConversationSummary {
    private Long id;
    private String attractionName;
    private String lastMessage;
    private String status;
    private LocalDateTime updatedAt;
}
