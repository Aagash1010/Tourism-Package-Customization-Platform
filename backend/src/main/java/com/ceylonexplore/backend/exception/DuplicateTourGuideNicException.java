package com.ceylonexplore.backend.exception;

public class DuplicateTourGuideNicException extends RuntimeException {

    public DuplicateTourGuideNicException() {
        super("A tour guide with this NIC number already exists.");
    }
}
