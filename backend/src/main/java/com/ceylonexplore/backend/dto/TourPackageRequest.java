package com.ceylonexplore.backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TourPackageRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 100) String destination,
        Long destinationId,
        @Size(max = 1000) String description,
        @Size(max = 2000) String fullDescription,
        @NotBlank @Size(max = 60) String duration,
        @Positive Integer durationDays,
        @Min(0) Integer durationNights,
        @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal price,
        @NotNull @Positive Integer maxTravelers,
        @Positive Integer minTravelers,
        @Size(max = 80) String category,
        @Size(max = 40) String difficultyLevel,
        @Size(max = 500)
        @Pattern(regexp = "(?i)^$|^(https?://[^\\s]+|/(?!/)[^\\s]*|(?:\\.\\.?/)?[A-Za-z0-9][A-Za-z0-9._/-]*)$",
                message = "Image URL must use HTTP, HTTPS, or a relative path.")
        String imageUrl,
        @Size(max = 2000) String inclusions,
        @Size(max = 2000) String exclusions,
        LocalDate startDate,
        LocalDate endDate,
        @NotBlank @Pattern(regexp = "Active|Inactive") String status,
        Boolean featured,
        @Pattern(regexp = "Yes|No") String accommodation,
        @Pattern(regexp = "Yes|No") String meals,
        @Pattern(regexp = "Yes|No") String transportation,
        @Valid @Size(max = 60) List<@Valid PackageItineraryRequest> itinerary
) {
}
