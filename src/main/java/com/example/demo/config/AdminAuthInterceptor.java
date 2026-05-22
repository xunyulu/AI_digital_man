package com.example.demo.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AdminAuthInterceptor implements HandlerInterceptor {

    private static final Map<String, String> TOKENS = new ConcurrentHashMap<>();

    static {
        // Default admin token (generated on first login)
        TOKENS.put("admin-token-placeholder", "admin");
    }

    public static String createToken(String username) {
        String token = UUID.randomUUID().toString();
        TOKENS.put(token, username);
        return token;
    }

    public static boolean isValidToken(String token) {
        return token != null && TOKENS.containsKey(token);
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        if (path.equals("/api/admin/login")) {
            return true;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            if (isValidToken(token)) {
                return true;
            }
        }

        response.setStatus(401);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"code\":401,\"message\":\"请先登录\"}");
        return false;
    }
}
