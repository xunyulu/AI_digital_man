package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.Attraction;
import com.example.demo.repository.AttractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAttractionController {

    private final AttractionRepository attractionRepository;

    @GetMapping("/attractions")
    public ApiResponse<List<Attraction>> list(@RequestParam(required = false) Long scenicSpotId) {
        if (scenicSpotId != null) {
            return ApiResponse.success(attractionRepository.findByScenicSpotIdOrderBySortOrder(scenicSpotId));
        }
        return ApiResponse.success(attractionRepository.findAll());
    }

    @PostMapping("/attractions")
    public ApiResponse<Attraction> create(@RequestBody Attraction attraction) {
        return ApiResponse.success(attractionRepository.save(attraction));
    }

    @PutMapping("/attractions/{id}")
    public ApiResponse<Attraction> update(@PathVariable Long id, @RequestBody Attraction attraction) {
        attraction.setId(id);
        return ApiResponse.success(attractionRepository.save(attraction));
    }

    @DeleteMapping("/attractions/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        attractionRepository.deleteById(id);
        return ApiResponse.success(null);
    }
}
