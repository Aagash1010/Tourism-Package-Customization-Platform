package com.ceylonexplore.backend.exception;

public class TouristInUseException extends RuntimeException {

    public TouristInUseException(Long id) {
        super("Tourist " + id + " cannot be deleted because bookings reference this record.");
    }
}
