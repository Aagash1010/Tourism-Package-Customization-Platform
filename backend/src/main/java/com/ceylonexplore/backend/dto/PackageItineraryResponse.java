package com.ceylonexplore.backend.dto;

public record PackageItineraryResponse(
        Integer dayNumber,
        String title,
        String description,
        String accommodation,
        String meals
) {
}
