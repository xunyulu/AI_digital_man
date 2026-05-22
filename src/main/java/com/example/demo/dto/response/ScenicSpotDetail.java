package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScenicSpotDetail {
    private Long id;
    private String name;
    private String category;
    private String locationCity;
    private String description;
    private String address;
    private String coverImage;
    private String openTime;
    private String ticketPrice;
    private String bestSeason;
    private String suggestedDuration;
    private String transportInfo;
    private String tips;
    private java.util.List<AttractionSummary> attractions;
}
