package com.ceylonexplore.backend.exception;

public class DuplicateAccountEmailException extends RuntimeException {

    public DuplicateAccountEmailException() {
        super("An account with this email address already exists.");
    }
}
