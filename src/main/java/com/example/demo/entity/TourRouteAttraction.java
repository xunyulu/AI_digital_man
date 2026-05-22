package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tour_route_attraction")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourRouteAttraction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "route_id", nullable = false)
    private TourRoute route;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attraction_id", nullable = false)
    private Attraction attraction;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "explanation_focus", length = 500)
    private String explanationFocus;
}
