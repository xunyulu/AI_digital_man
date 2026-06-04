package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.Attraction;
import com.example.demo.entity.KnowledgePoint;
import com.example.demo.entity.ScenicSpot;
import com.example.demo.entity.TourRoute;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/scenic-spots")
@RequiredArgsConstructor
public class ScenicSpotController {

    private final ScenicSpotRepository scenicSpotRepository;
    private final AttractionRepository attractionRepository;
    private final KnowledgePointRepository knowledgePointRepository;
    private final TourRouteRepository tourRouteRepository;
    private final TourRouteAttractionRepository tourRouteAttractionRepository;

    @GetMapping
    public ApiResponse<List<ScenicSpot>> list() {
        return ApiResponse.success(scenicSpotRepository.findAll());
    }

    @PostMapping
    public ApiResponse<ScenicSpot> create(@RequestBody ScenicSpot spot) {
        return ApiResponse.success(scenicSpotRepository.save(spot));
    }

    @PutMapping("/{id}")
    public ApiResponse<ScenicSpot> update(@PathVariable Long id, @RequestBody ScenicSpot spot) {
        spot.setId(id);
        return ApiResponse.success(scenicSpotRepository.save(spot));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ApiResponse<Void> delete(@PathVariable Long id) {
        // 1. 删除该景区下所有景点的路线关联和知识点
        List<Attraction> attractions = attractionRepository.findByScenicSpotIdOrderBySortOrder(id);
        for (Attraction a : attractions) {
            tourRouteAttractionRepository.deleteByAttractionId(a.getId());
            List<KnowledgePoint> kps = knowledgePointRepository.findByAttractionId(a.getId());
            knowledgePointRepository.deleteAll(kps);
        }

        // 2. 删除该景区下所有路线的景点关联
        List<TourRoute> routes = tourRouteRepository.findByScenicSpotIdOrderBySortOrder(id);
        for (TourRoute r : routes) {
            tourRouteAttractionRepository.deleteByRouteId(r.getId());
        }

        // 3. 删除该景区下的路线
        tourRouteRepository.deleteAll(routes);

        // 4. 删除该景区下的知识点(不关联特定景点的)
        List<KnowledgePoint> kps = knowledgePointRepository.findByScenicSpotId(id);
        knowledgePointRepository.deleteAll(kps);

        // 5. 删除该景区下的景点
        attractionRepository.deleteAll(attractions);

        // 6. 删除景区本身
        scenicSpotRepository.deleteById(id);
        return ApiResponse.success(null);
    }
}
