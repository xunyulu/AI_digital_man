package com.example.demo.controller.tourist;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.AttractionDetail;
import com.example.demo.dto.response.ScenicSpotDetail;
import com.example.demo.dto.response.ScenicSpotSummary;
import com.example.demo.dto.response.TourRouteResponse;
import com.example.demo.service.AttractionService;
import com.example.demo.service.TourRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tourist")
@RequiredArgsConstructor
public class TouristScenicSpotController {

    private final AttractionService attractionService;
    private final TourRouteService tourRouteService;

    @GetMapping("/scenic-spots")
    public ApiResponse<List<ScenicSpotSummary>> listScenicSpots(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String category) {
        return ApiResponse.success(attractionService.listScenicSpots(city, category));
    }

    @GetMapping("/scenic-spots/{id}")
    public ApiResponse<ScenicSpotDetail> getScenicSpot(@PathVariable Long id) {
        return ApiResponse.success(attractionService.getScenicSpotDetail(id));
    }

    @GetMapping("/scenic-spots/{id}/routes")
    public ApiResponse<List<TourRouteResponse>> getRoutes(@PathVariable Long id) {
        return ApiResponse.success(tourRouteService.getRoutesByScenicSpotId(id));
    }

    @GetMapping("/attractions/{id}")
    public ApiResponse<AttractionDetail> getAttraction(@PathVariable Long id) {
        return ApiResponse.success(attractionService.getAttractionDetail(id));
    }
}
