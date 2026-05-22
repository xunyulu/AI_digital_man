package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttractionDetail {
    private Long id;
    private Long scenicSpotId;
    private String scenicSpotName;
    private String name;
    private String description;
    private String imageUrl;
    private Double latitude;
    private Double longitude;
    private String openTime;
    private String ticketInfo;
}
