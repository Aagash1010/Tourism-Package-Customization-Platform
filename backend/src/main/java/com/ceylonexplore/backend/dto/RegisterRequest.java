package com.ceylonexplore.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Full name is required.")
        @Size(max = 120, message = "Full name must not exceed 120 characters.")
        String fullName,
        @NotBlank(message = "Email is required.")
        @Email(message = "Email must be a valid email address.")
        @Size(max = 254, message = "Email must not exceed 254 characters.")
        String email,
        @NotBlank(message = "Password is required.")
        @Size(min = 8, max = 72, message = "Password must contain between 8 and 72 characters.")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                message = "Password must contain an uppercase letter, a lowercase letter, and a number.")
        String password,
        @NotBlank(message = "Phone number is required.")
        @Size(max = 30, message = "Phone number must not exceed 30 characters.")
        @Pattern(regexp = "^[+()0-9.\\-\\s]{7,30}$", message = "Enter a valid phone number.")
        String phone,
        @NotBlank(message = "Country is required.")
        @Size(max = 100, message = "Country must not exceed 100 characters.")
        String country,
        @NotNull(message = "You must accept the terms and conditions.")
        @AssertTrue(message = "You must accept the terms and conditions.")
        Boolean termsAccepted
) {
}
