package com.ceylonexplore.backend.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.TypeMismatchException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(TouristNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleTouristNotFound(
            TouristNotFoundException exception,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.NOT_FOUND, exception.getMessage(), request, null);
    }

    @ExceptionHandler(DuplicateTouristEmailException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateTouristEmail(
            DuplicateTouristEmailException exception,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.CONFLICT, exception.getMessage(), request, null);
    }

    @ExceptionHandler(DuplicateAccountEmailException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicateAccountEmail(
            DuplicateAccountEmailException exception,
            HttpServletRequest request
    ) {
        return buildErrorResponse(HttpStatus.CONFLICT, exception.getMessage(), request, null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<Map<String, Object>> handleAuthenticationFailure(
            AuthenticationException exception,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.UNAUTHORIZED,
                "Invalid email or password.",
                request,
                null
        );
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, Object>> handleDataIntegrityViolation(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {
        logger.warn("Database constraint rejected request at {}", request.getRequestURI());
        return buildErrorResponse(
                HttpStatus.CONFLICT,
                "The request conflicts with an existing record.",
                request,
                null
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationFailure(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> errors = exception.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        error -> error.getField(),
                        error -> error.getDefaultMessage() == null ? "Invalid value." : error.getDefaultMessage(),
                        (first, ignored) -> first,
                        LinkedHashMap::new
                ));
        return buildErrorResponse(HttpStatus.BAD_REQUEST, "Request validation failed.", request, errors);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, TypeMismatchException.class})
    public ResponseEntity<Map<String, Object>> handleMalformedRequest(
            Exception exception,
            HttpServletRequest request
    ) {
        return buildErrorResponse(
                HttpStatus.BAD_REQUEST,
                "The request contains invalid or malformed values.",
                request,
                null
        );
    }

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
        return buildErrorResponse(
                status,
                message,
                request,
                null
        );
    }

    private ResponseEntity<Map<String, Object>> buildErrorResponse(
            HttpStatusCode status,
            String message,
            HttpServletRequest request,
            Map<String, String> fieldErrors
    ) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("success", false);
        response.put("message", message);
        response.put("status", status.value());
        response.put("path", request.getRequestURI());
        response.put("timestamp", Instant.now().toString());
        if (fieldErrors != null && !fieldErrors.isEmpty()) {
            response.put("errors", fieldErrors);
        }
        return ResponseEntity.status(status).body(response);
    }
}
