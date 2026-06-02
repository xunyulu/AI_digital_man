package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.TourRoute;
import com.example.demo.entity.TourRouteAttraction;
import com.example.demo.repository.TourRouteAttractionRepository;
import com.example.demo.repository.TourRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tour-routes")
@RequiredArgsConstructor
public class TourRouteController {

    private final TourRouteRepository tourRouteRepository;
    private final TourRouteAttractionRepository routeAttractionRepository;

    @GetMapping
    @Transactional(readOnly = true)
    public ApiResponse<List<TourRoute>> list(@RequestParam(required = false) Long scenicSpotId) {
        if (scenicSpotId != null) {
            return ApiResponse.success(tourRouteRepository.findByScenicSpotIdOrderBySortOrder(scenicSpotId));
        }
        return ApiResponse.success(tourRouteRepository.findAll());
    }

    @PostMapping
    public ApiResponse<TourRoute> create(@RequestBody TourRoute route) {
        return ApiResponse.success(tourRouteRepository.save(route));
    }

    @PutMapping("/{id}")
    public ApiResponse<TourRoute> update(@PathVariable Long id, @RequestBody TourRoute route) {
        route.setId(id);
        return ApiResponse.success(tourRouteRepository.save(route));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> delete(@PathVariable Long id) {
        routeAttractionRepository.deleteByRouteId(id);
        tourRouteRepository.deleteById(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/{routeId}/attractions")
    public ApiResponse<List<TourRouteAttraction>> getAttractions(@PathVariable Long routeId) {
        return ApiResponse.success(routeAttractionRepository.findByRouteIdOrderBySortOrder(routeId));
    }

    @PostMapping("/{routeId}/attractions")
    public ApiResponse<TourRouteAttraction> addAttraction(@PathVariable Long routeId,
                                                          @RequestBody TourRouteAttraction tra) {
        TourRoute route = tourRouteRepository.findById(routeId).orElseThrow();
        tra.setRoute(route);
        return ApiResponse.success(routeAttractionRepository.save(tra));
    }

    @DeleteMapping("/{routeId}/attractions/{id}")
    public ApiResponse<Void> removeAttraction(@PathVariable Long routeId, @PathVariable Long id) {
        routeAttractionRepository.deleteById(id);
        return ApiResponse.success(null);
    }
}
