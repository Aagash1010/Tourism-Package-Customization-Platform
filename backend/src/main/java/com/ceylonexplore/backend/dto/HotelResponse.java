package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.HotelStatus;
import com.ceylonexplore.backend.entity.HotelType;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Set;

public record HotelResponse(
        Long id,
        String hotelName,
        String description,
        String email,
        String phone,
        String address,
        String city,
        String district,
        String province,
        String country,
        Integer starRating,
        HotelType hotelType,
        String imageUrl,
        Set<String> facilities,
        LocalTime checkInTime,
        LocalTime checkOutTime,
        String website,
        Boolean featured,
        HotelStatus status,
        long roomsCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
