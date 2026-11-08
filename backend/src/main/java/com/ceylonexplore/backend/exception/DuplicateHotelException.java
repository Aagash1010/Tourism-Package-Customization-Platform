package com.ceylonexplore.backend.exception;

public class DuplicateHotelException extends RuntimeException {
    public DuplicateHotelException() {
        super("A hotel with this name already exists.");
    }
}
