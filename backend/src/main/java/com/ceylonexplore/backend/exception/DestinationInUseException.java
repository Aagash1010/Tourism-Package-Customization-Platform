package com.ceylonexplore.backend.exception;

public class DestinationInUseException extends RuntimeException {

    public DestinationInUseException(String message) {
        super(message);
    }
}
