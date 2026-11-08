package com.ceylonexplore.backend.exception;

public class DestinationNotFoundException extends RuntimeException {

    public DestinationNotFoundException(Long id) {
        super("Destination with ID " + id + " was not found.");
    }
}
