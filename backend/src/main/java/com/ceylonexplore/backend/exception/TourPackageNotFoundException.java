package com.ceylonexplore.backend.exception;

public class TourPackageNotFoundException extends RuntimeException {

    public TourPackageNotFoundException(Long id) {
        super("Tour package with id " + id + " was not found.");
    }
}
