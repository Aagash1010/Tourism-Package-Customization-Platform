package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.HotelStatus;
import com.ceylonexplore.backend.entity.HotelType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalTime;
import java.util.List;

public record HotelRequest(
        @NotBlank @Size(max = 120) String hotelName,
        @Size(max = 1500) String description,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 30)
        @Pattern(regexp = "^[+()0-9.\\-\\s]{7,30}$", message = "Phone must contain 7 to 30 valid phone characters.")
        String phone,
        @NotBlank @Size(max = 255) String address,
        @NotBlank @Size(max = 80) String city,
        @NotBlank @Size(max = 80) String district,
        @NotBlank @Size(max = 80) String province,
        @NotBlank @Size(max = 100) String country,
        @NotNull @Min(1) @Max(5) Integer starRating,
        @NotNull HotelType hotelType,
        @Size(max = 500)
        @Pattern(regexp = "(?i)^(https?://[^\\s]+|assets/images/[a-z0-9][a-z0-9._-]*)$",
                message = "Image must be an HTTP(S) URL or an image filename under assets/images.")
        String imageUrl,
        @Size(max = 30) List<@NotBlank @Size(max = 80) String> facilities,
        LocalTime checkInTime,
        LocalTime checkOutTime,
        @Size(max = 300)
        @Pattern(regexp = "(?i)^$|^https?://[^\\s]+$", message = "Website must be an HTTP(S) URL.")
        String website,
        Boolean featured,
        HotelStatus status
) {
}
