package com.example.demo.service;

import com.example.demo.dto.response.*;
import com.example.demo.entity.Attraction;
import com.example.demo.entity.ScenicSpot;
import com.example.demo.repository.AttractionRepository;
import com.example.demo.repository.ScenicSpotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttractionService {

    private final ScenicSpotRepository scenicSpotRepository;
    private final AttractionRepository attractionRepository;

    public List<ScenicSpotSummary> listScenicSpots(String city, String category) {
        List<ScenicSpot> spots;
        if (city != null && !city.isEmpty()) {
            spots = scenicSpotRepository.findByLocationCity(city);
        } else if (category != null && !category.isEmpty()) {
            spots = scenicSpotRepository.findByCategory(category);
        } else {
            spots = scenicSpotRepository.findAll();
        }

        return spots.stream().map(spot -> {
            int count = attractionRepository.findByScenicSpotIdOrderBySortOrder(spot.getId()).size();
            return ScenicSpotSummary.builder()
                    .id(spot.getId())
                    .name(spot.getName())
                    .category(spot.getCategory())
                    .locationCity(spot.getLocationCity())
                    .description(spot.getDescription())
                    .coverImage(spot.getCoverImage())
                    .suggestedDuration(spot.getSuggestedDuration())
                    .attractionCount(count)
                    .build();
        }).collect(Collectors.toList());
    }

    public ScenicSpotDetail getScenicSpotDetail(Long id) {
        ScenicSpot spot = scenicSpotRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("景区不存在"));

        List<AttractionSummary> attractions = attractionRepository
                .findByScenicSpotIdOrderBySortOrder(id)
                .stream()
                .map(a -> AttractionSummary.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .description(a.getDescription())
                        .imageUrl(a.getImageUrl())
                        .sortOrder(a.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        return ScenicSpotDetail.builder()
                .id(spot.getId())
                .name(spot.getName())
                .category(spot.getCategory())
                .locationCity(spot.getLocationCity())
                .description(spot.getDescription())
                .address(spot.getAddress())
                .coverImage(spot.getCoverImage())
                .openTime(spot.getOpenTime())
                .ticketPrice(spot.getTicketPrice())
                .bestSeason(spot.getBestSeason())
                .suggestedDuration(spot.getSuggestedDuration())
                .transportInfo(spot.getTransportInfo())
                .tips(spot.getTips())
                .attractions(attractions)
                .build();
    }

    public AttractionDetail getAttractionDetail(Long id) {
        Attraction a = attractionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("景点不存在"));

        return AttractionDetail.builder()
                .id(a.getId())
                .scenicSpotId(a.getScenicSpot().getId())
                .scenicSpotName(a.getScenicSpot().getName())
                .name(a.getName())
                .description(a.getDescription())
                .imageUrl(a.getImageUrl())
                .latitude(a.getLatitude())
                .longitude(a.getLongitude())
                .openTime(a.getOpenTime())
                .ticketInfo(a.getTicketInfo())
                .build();
    }
}
