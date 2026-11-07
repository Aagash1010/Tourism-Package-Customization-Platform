package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.TourGuideAvailabilityStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TourGuideRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 120, message = "Full name must not exceed 120 characters.")
        String fullName,

        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be a valid email address.")
        @Size(max = 254, message = "Email must not exceed 254 characters.")
        String email,

        @NotBlank(message = "Phone number is required.")
        @Size(max = 30, message = "Phone number must not exceed 30 characters.")
        String phoneNumber,

        @NotBlank(message = "Address is required.")
        @Size(max = 200, message = "Address must not exceed 200 characters.")
        String address,

        @NotBlank(message = "City is required.")
        @Size(max = 80, message = "City must not exceed 80 characters.")
        String city,

        @NotBlank(message = "District is required.")
        @Size(max = 80, message = "District must not exceed 80 characters.")
        String district,

        @NotBlank(message = "Nationality is required.")
        @Size(max = 80, message = "Nationality must not exceed 80 characters.")
        String nationality,

        @NotBlank(message = "NIC number is required.")
        @Size(max = 30, message = "NIC number must not exceed 30 characters.")
        String nicNumber,

        @NotBlank(message = "Gender is required.")
        @Size(max = 30, message = "Gender must not exceed 30 characters.")
        String gender,

        @NotNull(message = "Date of birth is required.")
        @Past(message = "Date of birth must be in the past.")
        LocalDate dateOfBirth,

        @NotBlank(message = "Guide license number is required.")
        @Size(max = 80, message = "Guide license number must not exceed 80 characters.")
        String licenseNumber,

        @NotBlank(message = "Qualification is required.")
        @Size(max = 120, message = "Qualification must not exceed 120 characters.")
        String qualification,

        @NotEmpty(message = "At least one language is required.")
        @Size(max = 20, message = "A guide may list at most 20 languages.")
        List<@NotBlank(message = "Language names must not be blank.")
                @Size(max = 50, message = "Language names must not exceed 50 characters.") String> languages,

        @NotEmpty(message = "Select at least one working day.")
        @Size(max = 7, message = "A guide may list at most 7 working days.")
        List<@NotBlank(message = "Working days must not be blank.")
                @Pattern(regexp = "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
                        message = "Working day is invalid.") String> workingDays,

        @NotEmpty(message = "Select at least one preferred tour type.")
        @Size(max = 20, message = "A guide may list at most 20 preferred tour types.")
        List<@NotBlank(message = "Preferred tour types must not be blank.")
                @Size(max = 80, message = "Preferred tour types must not exceed 80 characters.") String> preferredTourTypes,

        @NotBlank(message = "Specialization is required.")
        @Size(max = 120, message = "Specialization must not exceed 120 characters.")
        String specialization,

        @NotNull(message = "Experience years are required.")
        @PositiveOrZero(message = "Experience years must be zero or greater.")
        Integer experienceYears,

        @NotNull(message = "Daily rate is required.")
        @DecimalMin(value = "0.01", message = "Daily rate must be greater than zero.")
        @Digits(integer = 10, fraction = 2, message = "Daily rate must have at most 10 integer digits and 2 decimal places.")
        BigDecimal dailyRate,

        @Size(max = 500, message = "Profile image must not exceed 500 characters.")
        @Pattern(
                regexp = "(?i)^(https?://[^\\s]+|assets/images/[a-z0-9][a-z0-9._-]*)$",
                message = "Profile image must be an HTTP(S) URL or an image filename under assets/images."
        )
        String profileImage,

        TourGuideAvailabilityStatus availabilityStatus,

        @Pattern(regexp = "Active|Inactive", message = "Employment status must be Active or Inactive.")
        String employmentStatus,

        @NotNull(message = "Maximum group size is required.")
        @Positive(message = "Maximum group size must be greater than zero.")
        Integer maxGroupSize,

        @DecimalMin(value = "1.00", message = "Rating must be at least 1.")
        @DecimalMax(value = "5.00", message = "Rating must be at most 5.")
        @Digits(integer = 1, fraction = 2, message = "Rating must have at most 1 integer digit and 2 decimal places.")
        BigDecimal rating,

        @Size(max = 1000, message = "Certifications must not exceed 1000 characters.")
        String certifications,

        @Size(max = 2000, message = "Description must not exceed 2000 characters.")
        String description
) {
}
