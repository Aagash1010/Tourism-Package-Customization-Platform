package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.Tourist;
import com.ceylonexplore.backend.entity.TouristStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TouristResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String country,
        String address,
        LocalDate dateOfBirth,
        String gender,
        String profileImage,
        TouristStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static TouristResponse from(Tourist tourist) {
        return new TouristResponse(
                tourist.getId(),
                tourist.getFullName(),
                tourist.getEmail(),
                tourist.getPhone(),
                tourist.getCountry(),
                tourist.getAddress(),
                tourist.getDateOfBirth(),
                tourist.getGender(),
                tourist.getProfileImage(),
                tourist.getStatus(),
                tourist.getCreatedAt(),
                tourist.getUpdatedAt()
        );
    }
}
