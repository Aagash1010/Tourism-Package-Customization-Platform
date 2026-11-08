package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.UserAccount;

import java.time.LocalDateTime;

public record AccountResponse(
        Long id,
        String fullName,
        String email,
        String phone,
        String country,
        String address,
        String profileImage,
        AccountRole role,
        boolean enabled,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static AccountResponse from(UserAccount account) {
        return new AccountResponse(
                account.getId(),
                account.getFullName(),
                account.getEmail(),
                account.getPhone(),
                account.getCountry(),
                account.getAddress(),
                account.getProfileImage(),
                account.getRole(),
                account.isEnabled(),
                account.getCreatedAt(),
                account.getUpdatedAt()
        );
    }
}
