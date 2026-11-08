package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.RoomStatus;
import com.ceylonexplore.backend.entity.RoomType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record RoomRequest(
        @NotBlank @Size(max = 30) String roomNumber,
        @NotNull RoomType roomType,
        @NotNull @Positive Integer capacity,
        @NotNull @DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal pricePerNight,
        @NotNull @PositiveOrZero Integer availableRooms,
        @Size(max = 1000) String description,
        RoomStatus status
) {
}
