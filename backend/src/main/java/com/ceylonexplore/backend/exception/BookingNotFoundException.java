package com.ceylonexplore.backend.exception;

public class BookingNotFoundException extends RuntimeException {

    public BookingNotFoundException(Long id) {
        super("Booking with id " + id + " was not found.");
    }

    public BookingNotFoundException(String bookingReference) {
        super("Booking with reference " + bookingReference + " was not found.");
    }
}
