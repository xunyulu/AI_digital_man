package com.example.demo.controller.admin;

import com.example.demo.dto.response.ApiResponse;
import com.example.demo.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class DashboardController {

    private final AdminService adminService;

    @GetMapping("/dashboard/stats")
    public ApiResponse<Map<String, Object>> getStats() {
        return ApiResponse.success(adminService.getDashboardStats());
    }
}
