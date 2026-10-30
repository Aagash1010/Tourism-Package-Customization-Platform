package com.ceylonexplore.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public record BookingRequest(
        @NotNull(message = "Tourist ID is required.") Long touristId,
        @NotNull(message = "Tour package ID is required.") Long packageId,
        @NotNull(message = "Number of people is required.") @Min(value = 1, message = "Number of people must be at least 1.") Integer numberOfPeople,
        @NotNull(message = "Booking date is required.") @JsonFormat(pattern = "yyyy-MM-dd") LocalDate bookingDate,
        @NotNull(message = "Travel date is required.") @JsonFormat(pattern = "yyyy-MM-dd") LocalDate travelDate,
        String specialRequests,
        String bookingStatus,
        String paymentStatus,
        BigDecimal discount,
        BigDecimal amountPaid
) {
}
