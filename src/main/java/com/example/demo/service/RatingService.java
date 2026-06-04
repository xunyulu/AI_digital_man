package com.example.demo.service;

import com.example.demo.dto.request.SubmitRatingRequest;
import com.example.demo.entity.Attraction;
import com.example.demo.entity.Conversation;
import com.example.demo.entity.Rating;
import com.example.demo.entity.Tourist;
import com.example.demo.repository.AttractionRepository;
import com.example.demo.repository.ConversationRepository;
import com.example.demo.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RatingService {

    private final RatingRepository ratingRepository;
    private final ConversationRepository conversationRepository;
    private final AttractionRepository attractionRepository;

    public void submitRating(Tourist tourist, SubmitRatingRequest request) {
        Rating rating = Rating.builder()
                .tourist(tourist)
                .score(request.getScore())
                .comment(request.getComment())
                .build();

        if (request.getConversationId() != null) {
            Conversation conv = conversationRepository.findById(request.getConversationId()).orElse(null);
            rating.setConversation(conv);
        }
        if (request.getAttractionId() != null) {
            Attraction attr = attractionRepository.findById(request.getAttractionId()).orElse(null);
            rating.setAttraction(attr);
        }

        ratingRepository.save(rating);
    }

    public Map<String, Object> getRatingStats(Long attractionId, Long scenicSpotId) {
        Map<String, Object> stats = new HashMap<>();
        Double avgScore;

        if (attractionId != null) {
            List<Rating> ratings = ratingRepository.findByAttractionId(attractionId);
            avgScore = ratings.stream().mapToInt(Rating::getScore).average().orElse(0);
        } else if (scenicSpotId != null) {
            avgScore = ratingRepository.getAverageScoreByScenicSpotId(scenicSpotId);
        } else {
            avgScore = ratingRepository.getAverageScore();
        }
        stats.put("averageScore", avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0);

        if (scenicSpotId != null) {
            stats.put("totalCount", ratingRepository.countByAttractionScenicSpotId(scenicSpotId));
        } else {
            stats.put("totalCount", ratingRepository.count());
        }

        List<Object[]> dist = ratingRepository.getScoreDistribution();
        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }
        for (Object[] row : dist) {
            distribution.put(((Number) row[0]).intValue(), (Long) row[1]);
        }
        stats.put("distribution", distribution);

        return stats;
    }
}
