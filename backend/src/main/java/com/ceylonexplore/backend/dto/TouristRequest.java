package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.TouristStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record TouristRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 120, message = "Full name must not exceed 120 characters.")
        String fullName,

        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be a valid email address.")
        @Size(max = 254, message = "Email must not exceed 254 characters.")
        String email,

        @Size(max = 30, message = "Phone must not exceed 30 characters.")
        @Pattern(regexp = "^[+()0-9.\\-\\s]{7,30}$", message = "Phone must contain 7 to 30 valid phone characters.")
        String phone,

        @NotBlank(message = "Country is required.")
        @Size(max = 100, message = "Country must not exceed 100 characters.")
        String country,

        @Size(max = 255, message = "Address must not exceed 255 characters.")
        String address,

        @Past(message = "Date of birth must be in the past.")
        LocalDate dateOfBirth,

        @Size(max = 30, message = "Gender must not exceed 30 characters.")
        String gender,

        @Size(max = 500, message = "Profile image URL must not exceed 500 characters.")
        @Pattern(regexp = "^(https?://[^\\s]+)?$", message = "Profile image must be an HTTP or HTTPS URL.")
        String profileImage,

        TouristStatus status
) {
}
