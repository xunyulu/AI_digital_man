package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class TourRouteResponse {
    private Long id;
    private String name;
    private String description;
    private String theme;
    private String suggestedDuration;
    private String tips;
    private List<RouteAttractionItem> attractions;

    @Data
    @Builder
    public static class RouteAttractionItem {
        private Long attractionId;
        private String attractionName;
        private Integer sortOrder;
        private String explanationFocus;
    }
}
