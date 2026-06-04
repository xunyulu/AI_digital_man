package com.example.demo.service;

import com.example.demo.entity.AdminUser;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 管理员登录验证（支持自动升级旧明文密码）
     */
    public AdminUser login(String username, String password) {
        AdminUser user = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        // 兼容旧明文密码（首次登录后自动升级为BCrypt）
        if (isPlainText(user.getPassword())) {
            if (!password.equals(user.getPassword())) {
                throw new RuntimeException("用户名或密码错误");
            }
            // 自动升级为BCrypt
            user.setPassword(passwordEncoder.encode(password));
            adminUserRepository.save(user);
        } else {
            if (!passwordEncoder.matches(password, user.getPassword())) {
                throw new RuntimeException("用户名或密码错误");
            }
        }

        return user;
    }

    /**
     * 修改密码
     */
    public void changePassword(String username, String oldPassword, String newPassword) {
        AdminUser user = adminUserRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));

        // 验证旧密码
        if (isPlainText(user.getPassword())) {
            if (!oldPassword.equals(user.getPassword())) {
                throw new RuntimeException("原密码错误");
            }
        } else {
            if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
                throw new RuntimeException("原密码错误");
            }
        }

        // 设置新密码
        user.setPassword(passwordEncoder.encode(newPassword));
        adminUserRepository.save(user);
    }

    /**
     * 判断密码是否为明文（非BCrypt格式）
     * BCrypt哈希总是以 $2a$ 或 $2b$ 或 $2y$ 开头
     */
    private boolean isPlainText(String password) {
        return password == null || !password.startsWith("$2");
    }

    @Bean
    public BCryptPasswordEncoder bcryptPasswordEncoder() {
        return new BCryptPasswordEncoder();
    }

    public Map<String, Object> getDashboardStats(Long scenicSpotId) {
        Map<String, Object> stats = new HashMap<>();

        if (scenicSpotId != null) {
            stats.put("totalConversations", conversationRepository.countByAttractionScenicSpotId(scenicSpotId));
            stats.put("activeConversations", conversationRepository.countByAttractionScenicSpotIdAndStatus(scenicSpotId, "ACTIVE"));
            stats.put("totalTourists", conversationRepository.countDistinctTouristsByScenicSpotId(scenicSpotId));
            stats.put("totalRatings", ratingRepository.countByAttractionScenicSpotId(scenicSpotId));
            Double avgScore = ratingRepository.getAverageScoreByScenicSpotId(scenicSpotId);
            stats.put("averageScore", avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0);
        } else {
            stats.put("totalConversations", conversationRepository.count());
            stats.put("activeConversations", conversationRepository.countByStatus("ACTIVE"));
            stats.put("totalTourists", touristRepository.count());
            stats.put("totalRatings", ratingRepository.count());
            Double avgScore = ratingRepository.getAverageScore();
            stats.put("averageScore", avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0);
        }

        stats.put("totalScenicSpots", scenicSpotRepository.count());
        return stats;
    }
}
