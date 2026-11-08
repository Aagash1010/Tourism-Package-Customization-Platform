package com.ceylonexplore.backend.exception;

public class RoomNotFoundException extends RuntimeException {
    public RoomNotFoundException(Long id) {
        super("Room with id " + id + " was not found.");
    }
}
