package com.ceylonexplore.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.AssertTrue;

public record PasswordChangeRequest(
        @NotBlank(message = "Current password is required.")
        String currentPassword,

        @NotBlank(message = "New password is required.")
        @Size(min = 8, max = 72, message = "Password must contain between 8 and 72 characters.")
        @Pattern(regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$",
                message = "Password must contain an uppercase letter, a lowercase letter, and a number.")
        String newPassword,

        @NotBlank(message = "Confirm your new password.")
        String confirmNewPassword
) {
    @AssertTrue(message = "New passwords do not match.")
    public boolean isNewPasswordConfirmed() {
        return newPassword != null && newPassword.equals(confirmNewPassword);
    }
}
