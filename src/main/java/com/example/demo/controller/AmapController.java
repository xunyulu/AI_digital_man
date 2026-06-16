package com.example.demo.controller;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.Attraction;
import com.example.demo.repository.AttractionRepository;
import com.example.demo.service.SystemConfigService;
import com.example.demo.service.amap.AmapService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/amap")
@RequiredArgsConstructor
public class AmapController {

    private final AmapService amapService;
    private final AttractionRepository attractionRepository;
    private final SystemConfigService configService;

    @Value("${amap.js-api-key}")
    private String jsApiKey;

    @GetMapping("/config")
    public ApiResponse<Map<String, String>> getConfig() {
        Map<String, String> config = new HashMap<>();
        config.put("jsApiKey", jsApiKey);
        return ApiResponse.success(config);
    }

    /**
     * 获取景点标记列表，可按景区过滤
     */
    @GetMapping("/attractions")
    public ApiResponse<List<Map<String, Object>>> getAttractions(
            @RequestParam(required = false) Long scenicSpotId) {
        List<Attraction> attractions;
        if (scenicSpotId != null) {
            attractions = attractionRepository.findByScenicSpotIdOrderBySortOrder(scenicSpotId);
        } else {
            // 未指定景区时，使用管理员设置的活跃景区
            Long activeId = configService.getActiveScenicSpotId();
            if (activeId != null) {
                attractions = attractionRepository.findByScenicSpotIdOrderBySortOrder(activeId);
            } else {
                attractions = attractionRepository.findAll();
            }
        }
        List<Map<String, Object>> markers = attractions.stream()
                .filter(a -> a.getLatitude() != null && a.getLongitude() != null)
                .map(a -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", a.getId());
                    m.put("name", a.getName());
                    m.put("latitude", a.getLatitude());
                    m.put("longitude", a.getLongitude());
                    m.put("description", a.getDescription() != null && a.getDescription().length() > 80
                            ? a.getDescription().substring(0, 80) + "..." : a.getDescription());
                    m.put("scenicSpotId", a.getScenicSpot().getId());
                    return m;
                })
                .collect(Collectors.toList());
        return ApiResponse.success(markers);
    }

    /**
     * 获取活跃景区的地图标记（游客端快捷调用）
     */
    @GetMapping("/active-attractions")
    public ApiResponse<List<Map<String, Object>>> getActiveAttractions() {
        Long activeId = configService.getActiveScenicSpotId();
        if (activeId == null) {
            // 回退到第一个景区
            List<Attraction> all = attractionRepository.findAll();
            if (!all.isEmpty()) {
                activeId = all.get(0).getScenicSpot().getId();
            }
        }
        return getAttractions(activeId);
    }

    @GetMapping("/route/walking")
    public ApiResponse<Map<String, Object>> getWalkingRoute(
            @RequestParam double originLng,
            @RequestParam double originLat,
            @RequestParam double destLng,
            @RequestParam double destLat) {
        Map<String, Object> result = amapService.getWalkingRoute(originLng, originLat, destLng, destLat);
        return ApiResponse.success(result);
    }
}
