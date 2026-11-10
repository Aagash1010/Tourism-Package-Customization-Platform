package com.ceylonexplore.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record BookingRequest(
        @JsonProperty("touristId") @NotNull(message = "Tourist ID is required.") Long touristId,
        @JsonProperty("packageId") @NotNull(message = "Tour package ID is required.") Long packageId,
        @JsonProperty("numberOfPeople") @NotNull(message = "Number of people is required.") @Min(value = 1, message = "Number of people must be at least 1.") Integer numberOfPeople,
        @JsonProperty("bookingDate") @JsonDeserialize(using = FlexibleLocalDateTimeDeserializer.class) LocalDateTime bookingDate,
        @JsonProperty("travelDate") @NotNull(message = "Travel date is required.") @JsonFormat(pattern = "yyyy-MM-dd") LocalDate travelDate,
        @JsonProperty("specialRequests") String specialRequests,
        @JsonProperty("bookingStatus") String bookingStatus,
        @JsonProperty("paymentStatus") String paymentStatus,
        @JsonProperty("discount") BigDecimal discount,
        @JsonProperty("amountPaid") BigDecimal amountPaid
) {
}
