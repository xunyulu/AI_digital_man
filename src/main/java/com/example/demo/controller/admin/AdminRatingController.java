package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.Rating;
import com.example.demo.repository.RatingRepository;
import com.example.demo.service.RatingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminRatingController {

    private final RatingRepository ratingRepository;
    private final RatingService ratingService;

    @GetMapping("/ratings")
    public ApiResponse<Page<Rating>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ApiResponse.success(
                ratingRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size)));
    }

    @GetMapping("/ratings/stats")
    public ApiResponse<Map<String, Object>> stats(@RequestParam(required = false) Long attractionId,
                                                   @RequestParam(required = false) Long scenicSpotId) {
        return ApiResponse.success(ratingService.getRatingStats(attractionId, scenicSpotId));
    }
}
