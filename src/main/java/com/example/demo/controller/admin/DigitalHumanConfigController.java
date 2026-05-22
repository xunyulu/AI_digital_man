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

    @GetMapping
    public ApiResponse<Map<String, String>> getConfig() {
        Map<String, String> config = new HashMap<>();
        configRepository.findAll().forEach(c -> config.put(c.getConfigKey(), c.getConfigValue()));
        return ApiResponse.success(config);
    }

    @PutMapping
    public ApiResponse<String> updateConfig(@RequestBody Map<String, String> config) {
        config.forEach((key, value) -> {
            SystemConfig sc = configRepository.findById(key)
                    .orElse(SystemConfig.builder().configKey(key).build());
            sc.setConfigValue(value);
            configRepository.save(sc);
        });
        return ApiResponse.success("配置已保存");
    }
}
