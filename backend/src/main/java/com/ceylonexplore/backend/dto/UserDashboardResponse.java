package com.ceylonexplore.backend.dto;

import java.util.List;

public record UserDashboardResponse(
        long totalBookings,
        long upcomingTrips,
        long completedTrips,
        long pendingBookings,
        List<UserBookingResponse> recentBookings,
        List<UserBookingResponse> upcomingBookings
) {
}
