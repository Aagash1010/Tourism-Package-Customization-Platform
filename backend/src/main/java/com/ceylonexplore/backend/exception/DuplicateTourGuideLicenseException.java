package com.ceylonexplore.backend.exception;

public class DuplicateTourGuideLicenseException extends RuntimeException {

    public DuplicateTourGuideLicenseException() {
        super("A tour guide with this license number already exists.");
    }
}
