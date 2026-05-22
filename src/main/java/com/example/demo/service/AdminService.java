package com.example.demo.service;

import com.example.demo.entity.AdminUser;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final AdminUserRepository adminUserRepository;
    private final ConversationRepository conversationRepository;
    private final TouristRepository touristRepository;
    private final RatingRepository ratingRepository;
    private final ScenicSpotRepository scenicSpotRepository;

    public AdminUser login(String username, String password) {
        AdminUser user = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!password.equals(user.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }
        return user;
    }

    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalConversations", conversationRepository.count());
        stats.put("activeConversations", conversationRepository.countByStatus("ACTIVE"));
        stats.put("totalTourists", touristRepository.count());
        stats.put("totalRatings", ratingRepository.count());

        Double avgScore = ratingRepository.getAverageScore();
        stats.put("averageScore", avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0);

        stats.put("totalScenicSpots", scenicSpotRepository.count());
        return stats;
    }
}
