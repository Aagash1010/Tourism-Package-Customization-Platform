package com.ceylonexplore.backend.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BookingResponse(
        Long id,
        String bookingReference,
        Long touristId,
        String touristName,
        Long packageId,
        String packageName,
        BigDecimal packagePrice,
        Integer numberOfPeople,
        LocalDateTime bookingDate,
        LocalDate travelDate,
        BigDecimal totalAmount,
        BigDecimal discount,
        BigDecimal amountPaid,
        String bookingStatus,
        String paymentStatus,
        String specialRequests,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
