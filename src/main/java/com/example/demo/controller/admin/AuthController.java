package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.entity.AdminUser;
import com.example.demo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AuthController {

    private final AdminService adminService;

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        AdminUser user = adminService.login(username, password);
        String token = com.example.demo.config.AdminAuthInterceptor.createToken(username);
        return ApiResponse.success(Map.of(
                "id", user.getId(),
                "username", user.getUsername(),
                "role", user.getRole(),
                "token", token
        ));
    }
}
