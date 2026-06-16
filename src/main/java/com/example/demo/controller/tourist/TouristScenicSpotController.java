package com.example.demo.controller.tourist;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.AttractionDetail;
import com.example.demo.dto.response.ScenicSpotDetail;
import com.example.demo.dto.response.ScenicSpotSummary;
import com.example.demo.dto.response.TourRouteResponse;
import com.example.demo.service.AttractionService;
import com.example.demo.service.SystemConfigService;
import com.example.demo.service.TourRouteService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/tourist")
@RequiredArgsConstructor
public class TouristScenicSpotController {

    private final AttractionService attractionService;
    private final TourRouteService tourRouteService;
    private final SystemConfigService configService;

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

    /**
     * 获取管理员设置的活跃景区信息（公开接口，游客端用）
     */
    @GetMapping("/active-scenic-spot")
    public ApiResponse<Map<String, Object>> getActiveScenicSpot() {
        Long scenicSpotId = configService.getActiveScenicSpotId();
        Map<String, Object> result = new HashMap<>();
        if (scenicSpotId != null && scenicSpotId > 0) {
            ScenicSpotDetail detail = attractionService.getScenicSpotDetail(scenicSpotId);
            result.put("id", detail.getId());
            result.put("name", detail.getName());
        } else {
            // 没有设置活跃景区，返回第一个景区
            List<ScenicSpotSummary> spots = attractionService.listScenicSpots(null, null);
            if (!spots.isEmpty()) {
                result.put("id", spots.get(0).getId());
                result.put("name", spots.get(0).getName());
            } else {
                result.put("id", 0L);
                result.put("name", "景区");
            }
        }
        return ApiResponse.success(result);
    }
}
