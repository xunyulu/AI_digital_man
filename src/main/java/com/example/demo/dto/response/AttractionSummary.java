package com.example.demo.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AttractionSummary {
    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private Integer sortOrder;
}
