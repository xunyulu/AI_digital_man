package com.example.demo.dto.request;

import lombok.Data;

@Data
public class SubmitRatingRequest {
    private Long conversationId;
    private Long attractionId;
    private Integer score;
    private String comment;
}
