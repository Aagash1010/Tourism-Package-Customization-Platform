package com.ceylonexplore.backend.controller;

import com.ceylonexplore.backend.dto.AccountResponse;
import com.ceylonexplore.backend.dto.PasswordChangeRequest;
import com.ceylonexplore.backend.dto.ProfileUpdateRequest;
import com.ceylonexplore.backend.dto.BookingResponse;
import com.ceylonexplore.backend.dto.UserBookingRequest;
import com.ceylonexplore.backend.dto.UserBookingResponse;
import com.ceylonexplore.backend.dto.UserDashboardResponse;
import com.ceylonexplore.backend.service.UserDashboardService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users/me")
@PreAuthorize("hasRole('USER')")
public class UserController {

    private final UserDashboardService userDashboardService;

    public UserController(UserDashboardService userDashboardService) {
        this.userDashboardService = userDashboardService;
    }

    @GetMapping
    public AccountResponse profile(Authentication authentication) {
        return userDashboardService.getProfile(authentication.getName());
    }

    @PutMapping
    public AccountResponse updateProfile(
            Authentication authentication,
            @Valid @RequestBody ProfileUpdateRequest request
    ) {
        return userDashboardService.updateProfile(authentication.getName(), request);
    }

    @PutMapping("/password")
    public Map<String, Object> changePassword(
            Authentication authentication,
            @Valid @RequestBody PasswordChangeRequest request
    ) {
        userDashboardService.changePassword(authentication.getName(), request);
        return Map.of("success", true, "message", "Password updated successfully.");
    }

    @GetMapping("/dashboard")
    public UserDashboardResponse dashboard(Authentication authentication) {
        return userDashboardService.getDashboard(authentication.getName());
    }

    @GetMapping("/bookings")
    public List<UserBookingResponse> bookings(Authentication authentication) {
        return userDashboardService.getBookings(authentication.getName());
    }

    @PostMapping("/bookings")
    public BookingResponse createBooking(
            Authentication authentication,
            @Valid @RequestBody UserBookingRequest request
    ) {
        return userDashboardService.createBooking(authentication.getName(), request);
    }

    @GetMapping("/bookings/upcoming")
    public List<UserBookingResponse> upcomingBookings(Authentication authentication) {
        return userDashboardService.getUpcomingBookings(authentication.getName());
    }

    @GetMapping("/bookings/history")
    public List<UserBookingResponse> bookingHistory(Authentication authentication) {
        return userDashboardService.getBookingHistory(authentication.getName());
    }

    @GetMapping("/bookings/{bookingReference}")
    public UserBookingResponse booking(
            Authentication authentication,
            @PathVariable String bookingReference
    ) {
        return userDashboardService.getBooking(authentication.getName(), bookingReference);
    }
}
