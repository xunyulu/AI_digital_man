package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.SystemConfig;
import com.example.demo.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/config")
@RequiredArgsConstructor
public class DigitalHumanConfigController {

    private final SystemConfigRepository configRepository;

    /**
     * 获取配置：先加载全局配置，再用景区专属配置覆盖
     * 景区专属配置的key格式: "{scenicSpotId}:{configKey}"
     * @param scenicSpotId 景区ID，为空时仅返回全局配置
     */
    @GetMapping
    public ApiResponse<Map<String, String>> getConfig(@RequestParam(required = false) Long scenicSpotId) {
        Map<String, String> config = new HashMap<>();
        // 1. 加载全局配置（key不含冒号前缀的）
        configRepository.findAll().forEach(c -> {
            if (!c.getConfigKey().contains(":")) {
                config.put(c.getConfigKey(), c.getConfigValue());
            }
        });
        // 2. 加载景区专属配置并覆盖
        if (scenicSpotId != null) {
            String prefix = scenicSpotId + ":";
            configRepository.findByConfigKeyStartingWith(prefix).forEach(c -> {
                String plainKey = c.getConfigKey().substring(prefix.length());
                config.put(plainKey, c.getConfigValue());
            });
        }
        return ApiResponse.success(config);
    }

    /**
     * 保存配置：如果传了scenicSpotId则保存为景区专属配置（key加前缀），否则为全局配置
     */
    @PutMapping
    public ApiResponse<String> updateConfig(@RequestBody Map<String, String> config,
                                            @RequestParam(required = false) Long scenicSpotId) {
        String prefix = scenicSpotId != null ? scenicSpotId + ":" : "";
        config.forEach((plainKey, value) -> {
            String storeKey = prefix + plainKey;
            SystemConfig sc = configRepository.findById(storeKey)
                    .orElse(SystemConfig.builder().configKey(storeKey).build());
            sc.setConfigValue(value);
            configRepository.save(sc);
        });
        return ApiResponse.success("配置已保存");
    }
}
