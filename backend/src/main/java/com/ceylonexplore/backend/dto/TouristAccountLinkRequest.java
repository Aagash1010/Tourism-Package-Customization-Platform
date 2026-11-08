package com.ceylonexplore.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TouristAccountLinkRequest(
        @NotNull(message = "User account ID is required.")
        @Positive(message = "User account ID must be positive.")
        Long accountId
) {
}
