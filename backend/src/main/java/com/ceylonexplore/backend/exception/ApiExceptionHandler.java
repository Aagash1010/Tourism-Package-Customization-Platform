package com.ceylonexplore.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request
    ) {
        logger.error("Request failed at {} ({})", request.getRequestURI(), exception.getClass().getSimpleName());
        HttpStatusCode status = exception instanceof ErrorResponse errorResponse
                ? errorResponse.getStatusCode()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        String message = status.is4xxClientError()
                ? "The request could not be completed."
                : "An unexpected server error occurred.";

        return ResponseEntity.status(status).body(Map.of(
                "success", false,
                "message", message,
                "status", status.value(),
                "path", request.getRequestURI(),
                "timestamp", Instant.now().toString()
        ));
    }
}
