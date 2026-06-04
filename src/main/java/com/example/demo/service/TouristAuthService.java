package com.example.demo.service;

import com.example.demo.entity.TokenEntity;
import com.example.demo.entity.Tourist;
import com.example.demo.repository.TouristRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TouristAuthService {

    private final TouristRepository touristRepository;
    private final TokenService tokenService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * 游客注册（用户名+密码）
     */
    public Tourist register(String username, String password, String nickname) {
        if (username == null || username.trim().isEmpty()) {
            throw new RuntimeException("用户名不能为空");
        }
        if (password == null || password.length() < 6) {
            throw new RuntimeException("密码长度不能少于6位");
        }
        if (touristRepository.existsByUsername(username)) {
            throw new RuntimeException("用户名已存在");
        }

        Tourist tourist = Tourist.builder()
                .deviceId("reg-" + username) // 为注册用户生成唯一deviceId
                .username(username)
                .password(passwordEncoder.encode(password))
                .nickname(nickname != null ? nickname : username)
                .build();
        return touristRepository.save(tourist);
    }

    /**
     * 游客登录（用户名+密码）
     */
    public TokenEntity login(String username, String password) {
        Tourist tourist = touristRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户名或密码错误"));

        if (!passwordEncoder.matches(password, tourist.getPassword())) {
            throw new RuntimeException("用户名或密码错误");
        }

        return tokenService.createToken(
                username, "TOURIST", "tourist", tourist.getId());
    }

    /**
     * 获取游客信息（通过用户名）
     */
    public Tourist getByUsername(String username) {
        return touristRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("用户不存在"));
    }
}
