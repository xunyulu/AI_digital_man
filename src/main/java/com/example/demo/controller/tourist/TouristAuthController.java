package com.example.demo.controller.tourist;

import com.example.demo.annotation.IgnoreAuth;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.TokenEntity;
import com.example.demo.entity.Tourist;
import com.example.demo.service.TokenService;
import com.example.demo.service.TouristAuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/tourist/auth")
@RequiredArgsConstructor
public class TouristAuthController {

    private final TouristAuthService touristAuthService;
    private final TokenService tokenService;

    /**
     * 游客注册
     */
    @IgnoreAuth
    @PostMapping("/register")
    public ApiResponse<Map<String, Object>> register(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        String nickname = body.getOrDefault("nickname", username);

        Tourist tourist = touristAuthService.register(username, password, nickname);

        Map<String, Object> data = new HashMap<>();
        data.put("id", tourist.getId());
        data.put("username", tourist.getUsername());
        data.put("nickname", tourist.getNickname());
        data.put("deviceId", tourist.getDeviceId());
        return ApiResponse.success("注册成功", data);
    }

    /**
     * 游客登录
     */
    @IgnoreAuth
    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ApiResponse.error(400, "用户名和密码不能为空");
        }

        TokenEntity token = touristAuthService.login(username, password);
        Tourist tourist = touristAuthService.getByUsername(username);

        Map<String, Object> data = new HashMap<>();
        data.put("id", tourist.getId());
        data.put("username", tourist.getUsername());
        data.put("nickname", tourist.getNickname());
        data.put("deviceId", tourist.getDeviceId());
        data.put("token", token.getToken());
        return ApiResponse.success(data);
    }

    /**
     * 获取当前登录游客信息
     */
    @GetMapping("/session")
    public ApiResponse<Map<String, Object>> session(HttpServletRequest request) {
        String username = (String) request.getAttribute("username");
        Long userId = (Long) request.getAttribute("userId");

        Tourist tourist = touristAuthService.getByUsername(username);

        Map<String, Object> data = new HashMap<>();
        data.put("id", userId);
        data.put("username", tourist.getUsername());
        data.put("nickname", tourist.getNickname());
        data.put("deviceId", tourist.getDeviceId());
        return ApiResponse.success(data);
    }

    /**
     * 退出登录
     */
    @PostMapping("/logout")
    public ApiResponse<String> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            tokenService.removeToken(token);
        }
        return ApiResponse.success("已退出登录");
    }
}
