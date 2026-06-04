package com.example.demo.service;

import com.example.demo.entity.TokenEntity;
import com.example.demo.repository.TokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TokenService {

    private final TokenRepository tokenRepository;

    private static final int EXPIRE_HOURS = 24;

    /**
     * 生成新token并持久化到数据库
     */
    public TokenEntity createToken(String username, String role, String tableName, Long userId) {
        // 先删除该用户旧的token（单点登录）
        tokenRepository.deleteByUsername(username);

        TokenEntity token = TokenEntity.builder()
                .token(UUID.randomUUID().toString().replace("-", ""))
                .username(username)
                .role(role)
                .tableName(tableName)
                .userId(userId)
                .expireTime(LocalDateTime.now().plusHours(EXPIRE_HOURS))
                .build();
        return tokenRepository.save(token);
    }

    /**
     * 验证token是否有效
     */
    public Optional<TokenEntity> getValidToken(String token) {
        Optional<TokenEntity> tokenEntity = tokenRepository.findById(token);
        if (tokenEntity.isPresent() && !tokenEntity.get().isExpired()) {
            return tokenEntity;
        }
        // Token不存在或已过期，清理
        tokenEntity.ifPresent(t -> tokenRepository.delete(t));
        return Optional.empty();
    }

    /**
     * 销毁token（登出）
     */
    public void removeToken(String token) {
        tokenRepository.deleteById(token);
    }

    /**
     * 定时清理过期token（每小时执行）
     */
    @Scheduled(fixedRate = 3600000)
    public void cleanExpiredTokens() {
        tokenRepository.deleteExpired(LocalDateTime.now());
    }
}
