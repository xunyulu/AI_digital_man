package com.example.demo.dto.request;

import lombok.Data;

@Data
public class SubmitRatingRequest {
    private Long conversationId;
    private Long attractionId;
    private Long scenicSpotId;
    private Integer score;
    private String comment;
}
