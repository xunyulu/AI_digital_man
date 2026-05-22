package com.example.demo.controller.tourist;

import com.example.demo.dto.request.SubmitRatingRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.Tourist;
import com.example.demo.service.RatingService;
import com.example.demo.service.TouristService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/tourist")
@RequiredArgsConstructor
public class TouristRatingController {

    private final RatingService ratingService;
    private final TouristService touristService;

    @PostMapping("/rating")
    public ApiResponse<Void> submitRating(
            @RequestParam String deviceId,
            @RequestBody SubmitRatingRequest request) {
        Tourist tourist = touristService.findOrCreateByDeviceId(deviceId);
        ratingService.submitRating(tourist, request);
        return ApiResponse.success("评价提交成功", null);
    }

    @GetMapping("/ratings/stats")
    public ApiResponse<Map<String, Object>> getStats(@RequestParam(required = false) Long attractionId) {
        return ApiResponse.success(ratingService.getRatingStats(attractionId));
    }
}
