package com.example.demo.service;

import com.example.demo.dto.response.TourRouteResponse;
import com.example.demo.entity.TourRoute;
import com.example.demo.entity.TourRouteAttraction;
import com.example.demo.repository.TourRouteAttractionRepository;
import com.example.demo.repository.TourRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TourRouteService {

    private final TourRouteRepository tourRouteRepository;
    private final TourRouteAttractionRepository routeAttractionRepository;

    @Transactional(readOnly = true)
    public List<TourRouteResponse> getRoutesByScenicSpotId(Long scenicSpotId) {
        List<TourRoute> routes = tourRouteRepository.findByScenicSpotIdOrderBySortOrder(scenicSpotId);

        return routes.stream().map(route -> {
            List<TourRouteResponse.RouteAttractionItem> items = routeAttractionRepository
                    .findByRouteIdOrderBySortOrder(route.getId())
                    .stream()
                    .map(ra -> TourRouteResponse.RouteAttractionItem.builder()
                            .attractionId(ra.getAttraction().getId())
                            .attractionName(ra.getAttraction().getName())
                            .sortOrder(ra.getSortOrder())
                            .explanationFocus(ra.getExplanationFocus())
                            .build())
                    .collect(Collectors.toList());

            return TourRouteResponse.builder()
                    .id(route.getId())
                    .name(route.getName())
                    .description(route.getDescription())
                    .theme(route.getTheme())
                    .suggestedDuration(route.getSuggestedDuration())
                    .tips(route.getTips())
                    .attractions(items)
                    .build();
        }).collect(Collectors.toList());
    }
}
