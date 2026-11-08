package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.RoomStatus;
import com.ceylonexplore.backend.entity.RoomType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record RoomResponse(
        Long id,
        Long hotelId,
        String hotelName,
        String roomNumber,
        RoomType roomType,
        Integer capacity,
        BigDecimal pricePerNight,
        Integer availableRooms,
        String description,
        RoomStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
