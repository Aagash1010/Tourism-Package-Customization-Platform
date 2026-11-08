package com.ceylonexplore.backend.exception;

public class DuplicateRoomException extends RuntimeException {
    public DuplicateRoomException() {
        super("A room with this number already exists at the selected hotel.");
    }
}
