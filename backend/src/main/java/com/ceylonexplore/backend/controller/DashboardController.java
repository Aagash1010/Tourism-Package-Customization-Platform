package com.ceylonexplore.backend.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class DashboardController {

    @GetMapping("/api/user/dashboard")
    public Map<String, Object> userDashboard(Authentication authentication) {
        return Map.of(
                "success", true,
                "message", "User dashboard access granted.",
                "email", authentication.getName()
        );
    }

    @GetMapping("/api/admin/dashboard")
    public Map<String, Object> adminDashboard(Authentication authentication) {
        return Map.of(
                "success", true,
                "message", "Admin dashboard access granted.",
                "email", authentication.getName()
        );
    }
}
