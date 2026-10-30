package com.ceylonexplore.backend.dto;

public record AuthResponse(boolean success, AccountResponse user) {
}
