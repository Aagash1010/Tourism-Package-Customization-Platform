package com.ceylonexplore.backend.exception;

public class HotelNotFoundException extends RuntimeException {
    public HotelNotFoundException(Long id) {
        super("Hotel with id " + id + " was not found.");
    }
}
