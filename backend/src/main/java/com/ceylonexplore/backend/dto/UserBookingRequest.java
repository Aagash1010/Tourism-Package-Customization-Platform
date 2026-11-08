package com.ceylonexplore.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UserBookingRequest(
        @NotNull(message = "Tour package is required.")
        Long packageId,

        @NotNull(message = "Number of people is required.")
        @Min(value = 1, message = "Number of people must be at least 1.")
        Integer numberOfPeople,

        @NotNull(message = "Travel date is required.")
        LocalDate travelDate,

        @Size(max = 1000, message = "Special requests must not exceed 1000 characters.")
        String specialRequests
) {
}
