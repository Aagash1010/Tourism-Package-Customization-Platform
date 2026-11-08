package com.ceylonexplore.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record TourPackageResponse(
        Long id,
        String name,
        String destination,
        Long destinationId,
        String description,
        String fullDescription,
        String duration,
        Integer durationDays,
        Integer durationNights,
        BigDecimal price,
        Integer maxTravelers,
        Integer minTravelers,
        String category,
        String difficultyLevel,
        String imageUrl,
        String inclusions,
        String exclusions,
        LocalDate startDate,
        LocalDate endDate,
        String status,
        Boolean featured,
        String accommodation,
        String meals,
        String transportation,
        List<PackageItineraryResponse> itinerary,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
