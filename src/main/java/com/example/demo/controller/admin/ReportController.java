package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.Message;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.RatingRepository;
import com.example.demo.repository.ConversationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class ReportController {

    private final MessageRepository messageRepository;
    private final RatingRepository ratingRepository;
    private final ConversationRepository conversationRepository;

    @GetMapping("/sentiment")
    public ApiResponse<Map<String, Object>> sentiment(@RequestParam(required = false) Long scenicSpotId) {
        Map<String, Object> report = new HashMap<>();

        // Top user queries — filtered by scenic spot if provided
        List<Message> userMessages;
        if (scenicSpotId != null) {
            userMessages = messageRepository.findTopByAttractionScenicSpotIdAndRoleOrderByCreatedAtDesc(
                    scenicSpotId, "user", PageRequest.of(0, 50));
        } else {
            userMessages = messageRepository.findTop50ByRoleOrderByCreatedAtDesc("user",
                    PageRequest.of(0, 50));
        }
        List<String> queries = userMessages.stream()
                .map(Message::getContent)
                .filter(c -> c != null && !c.isEmpty())
                .limit(20)
                .toList();
        report.put("recentQueries", queries);

        // Rating stats
        long totalRatings;
        Double avgScore;
        if (scenicSpotId != null) {
            totalRatings = ratingRepository.countByAttractionScenicSpotId(scenicSpotId);
            avgScore = ratingRepository.getAverageScoreByScenicSpotId(scenicSpotId);
        } else {
            totalRatings = ratingRepository.count();
            avgScore = ratingRepository.getAverageScore();
        }
        report.put("totalRatings", totalRatings);
        report.put("averageScore", avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0);

        // Rating distribution
        List<Map<String, Object>> distribution = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            long count = ratingRepository.countByScore(i);
            Map<String, Object> item = new HashMap<>();
            item.put("score", i);
            item.put("count", count);
            distribution.add(item);
        }
        report.put("ratingDistribution", distribution);

        return ApiResponse.success(report);
    }
}
