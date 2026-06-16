package com.example.demo.service;

import com.example.demo.entity.SystemConfig;
import com.example.demo.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * 统一配置读取服务
 * 支持全局配置 + 景区专属配置覆盖（key前缀: "{scenicSpotId}:"）
 */
@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigRepository configRepository;

    private static final String ACTIVE_SCENIC_SPOT_KEY = "active_scenic_spot_id";

    /**
     * 获取管理员设置的活跃景区ID
     */
    public Long getActiveScenicSpotId() {
        Optional<SystemConfig> config = configRepository.findById(ACTIVE_SCENIC_SPOT_KEY);
        if (config.isPresent()) {
            try {
                return Long.parseLong(config.get().getConfigValue());
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    /**
     * 设置活跃景区ID
     */
    public void setActiveScenicSpotId(Long scenicSpotId) {
        SystemConfig config = configRepository.findById(ACTIVE_SCENIC_SPOT_KEY)
                .orElse(SystemConfig.builder().configKey(ACTIVE_SCENIC_SPOT_KEY).build());
        config.setConfigValue(String.valueOf(scenicSpotId));
        configRepository.save(config);
    }

    /**
     * 获取配置值（支持景区覆盖）
     * 优先级: {scenicSpotId}:key > key（全局） > defaultValue
     *
     * @param scenicSpotId 景区ID，为null时只查全局
     * @param key          配置键
     * @param defaultValue 默认值
     */
    public String getConfigValue(Long scenicSpotId, String key, String defaultValue) {
        // 1. 查景区专属配置: {scenicSpotId}:key
        if (scenicSpotId != null) {
            String scopedKey = scenicSpotId + ":" + key;
            Optional<SystemConfig> scoped = configRepository.findById(scopedKey);
            if (scoped.isPresent() && scoped.get().getConfigValue() != null
                    && !scoped.get().getConfigValue().isEmpty()) {
                return scoped.get().getConfigValue();
            }
        }

        // 2. 查全局配置: key
        Optional<SystemConfig> global = configRepository.findById(key);
        if (global.isPresent() && global.get().getConfigValue() != null
                && !global.get().getConfigValue().isEmpty()) {
            return global.get().getConfigValue();
        }

        // 3. 返回默认值
        return defaultValue;
    }
}
