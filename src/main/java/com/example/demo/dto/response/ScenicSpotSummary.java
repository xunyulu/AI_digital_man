package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ScenicSpotSummary {
    private Long id;
    private String name;
    private String category;
    private String locationCity;
    private String description;
    private String coverImage;
    private String suggestedDuration;
    private int attractionCount;
}
