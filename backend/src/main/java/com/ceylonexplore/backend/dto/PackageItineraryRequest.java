package com.ceylonexplore.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record PackageItineraryRequest(
        @NotNull @Positive Integer dayNumber,
        @NotBlank @Size(max = 120) String title,
        @Size(max = 1500) String description,
        @Size(max = 200) String accommodation,
        @Size(max = 200) String meals
) {
}
