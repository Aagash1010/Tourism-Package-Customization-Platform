package com.ceylonexplore.backend.exception;

public class DuplicateTouristEmailException extends RuntimeException {

    public DuplicateTouristEmailException() {
        super("A tourist with this email address already exists.");
    }
}
