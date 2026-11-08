package com.ceylonexplore.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 120, message = "Full name must not exceed 120 characters.")
        String fullName,

        @Size(max = 30, message = "Phone number must not exceed 30 characters.")
        @Pattern(regexp = "^$|^[+()0-9.\\-\\s]{7,30}$", message = "Enter a valid phone number.")
        String phone,

        @NotBlank(message = "Country is required.")
        @Size(max = 100, message = "Country must not exceed 100 characters.")
        String country,

        @Size(max = 255, message = "Address must not exceed 255 characters.")
        String address,

        @Size(max = 500, message = "Profile image URL must not exceed 500 characters.")
        @Pattern(regexp = "(?i)^(?:$|https?://[^\\s]+)$", message = "Profile image must be an HTTP or HTTPS URL.")
        String profileImage
) {
}
