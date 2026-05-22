package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.ScenicSpot;
import com.example.demo.repository.ScenicSpotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/scenic-spots")
@RequiredArgsConstructor
public class ScenicSpotController {

    private final ScenicSpotRepository scenicSpotRepository;

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
    public ApiResponse<Void> delete(@PathVariable Long id) {
        scenicSpotRepository.deleteById(id);
        return ApiResponse.success(null);
    }
}
