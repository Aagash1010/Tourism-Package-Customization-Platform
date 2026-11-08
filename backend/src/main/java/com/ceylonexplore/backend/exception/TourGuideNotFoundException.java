package com.ceylonexplore.backend.exception;

public class TourGuideNotFoundException extends RuntimeException {

    public TourGuideNotFoundException(Long id) {
        super("Tour guide with ID " + id + " was not found.");
    }
}
