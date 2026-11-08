package com.ceylonexplore.backend.exception;

public class DuplicateTourPackageException extends RuntimeException {
    public DuplicateTourPackageException() {
        super("A tour package with this name already exists.");
    }
}
