package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "scenic_spot")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScenicSpot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(length = 50)
    private String category;

    @Column(name = "location_city", length = 50)
    private String locationCity;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String address;

    @Column(name = "cover_image", length = 500)
    private String coverImage;

    @Column(name = "open_time", length = 255)
    private String openTime;

    @Column(name = "ticket_price", length = 255)
    private String ticketPrice;

    @Column(name = "best_season", length = 100)
    private String bestSeason;

    @Column(name = "suggested_duration", length = 50)
    private String suggestedDuration;

    @Column(name = "transport_info", columnDefinition = "TEXT")
    private String transportInfo;

    @Column(columnDefinition = "TEXT")
    private String tips;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
