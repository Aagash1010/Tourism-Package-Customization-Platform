package com.ceylonexplore.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record UserBookingResponse(
        String bookingReference,
        String touristName,
        String touristEmail,
        String touristPhone,
        String touristCountry,
        String packageName,
        String destination,
        String destinationProvince,
        String destinationDistrict,
        String destinationAddress,
        String packageImage,
        String destinationImage,
        Integer durationDays,
        LocalDateTime bookingDate,
        LocalDate travelDate,
        Integer numberOfPeople,
        BigDecimal totalAmount,
        String bookingStatus,
        String paymentStatus,
        String specialRequests,
        LocalDateTime createdAt
) {
}
