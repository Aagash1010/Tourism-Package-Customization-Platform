package com.ceylonexplore.backend.exception;

public class HotelInUseException extends RuntimeException {
    public HotelInUseException() {
        super("Hotel cannot be deleted while rooms are assigned to it.");
    }
}
