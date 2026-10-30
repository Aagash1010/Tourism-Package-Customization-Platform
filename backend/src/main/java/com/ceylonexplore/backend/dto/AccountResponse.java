package com.ceylonexplore.backend.dto;

import com.ceylonexplore.backend.entity.AccountRole;
import com.ceylonexplore.backend.entity.UserAccount;

public record AccountResponse(
        Long id,
        String fullName,
        String email,
        AccountRole role
) {
    public static AccountResponse from(UserAccount account) {
        return new AccountResponse(account.getId(), account.getFullName(), account.getEmail(), account.getRole());
    }
}
