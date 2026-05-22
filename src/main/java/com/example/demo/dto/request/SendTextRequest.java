package com.example.demo.dto.request;

import lombok.Data;

@Data
public class SendTextRequest {
    private String text;
    private Long attractionId;
}
