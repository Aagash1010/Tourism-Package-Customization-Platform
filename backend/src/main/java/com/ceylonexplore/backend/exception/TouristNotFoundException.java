package com.ceylonexplore.backend.exception;

public class TouristNotFoundException extends RuntimeException {

    public TouristNotFoundException(Long id) {
        super("Tourist with ID " + id + " was not found.");
    }
}
