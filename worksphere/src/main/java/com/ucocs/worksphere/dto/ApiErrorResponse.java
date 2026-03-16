package com.ucocs.worksphere.dto;

import java.time.LocalDateTime;
import java.util.List;

public record ApiErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        List<String> errors,
        String path) {

    // Factory method for single message (most handlers)
    public static ApiErrorResponse of(
            int status, String error, String message, String path) {
        return new ApiErrorResponse(LocalDateTime.now(), status, error, message, null, path);
    }

    // Factory method for multiple messages (validation)
    public static ApiErrorResponse ofErrors(
            int status, String error, List<String> errors, String path) {
        return new ApiErrorResponse(LocalDateTime.now(), status, error, null, errors, path);
    }
}