package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.TourGuideAvailabilityStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record TourGuideResponse(
        Long id,
        String fullName,
        String email,
        String phoneNumber,
        String address,
        String city,
        String district,
        String nationality,
        String nicNumber,
        String gender,
        LocalDate dateOfBirth,
        String licenseNumber,
        String qualification,
        List<String> languages,
        List<String> workingDays,
        List<String> preferredTourTypes,
        String specialization,
        Integer experienceYears,
        BigDecimal dailyRate,
        String profileImage,
        TourGuideAvailabilityStatus availabilityStatus,
        String employmentStatus,
        Integer maxGroupSize,
        BigDecimal rating,
        String certifications,
        String description,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
