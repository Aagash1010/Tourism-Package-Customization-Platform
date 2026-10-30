package com.ceylonexplore.backend.exception;

public class DuplicateTourGuideEmailException extends RuntimeException {

    public DuplicateTourGuideEmailException() {
        super("A tour guide with this email already exists.");
    }
}
