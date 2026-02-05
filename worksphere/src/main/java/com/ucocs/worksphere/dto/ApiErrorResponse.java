package com.ucocs.worksphere.dto;

import java.time.LocalDateTime;

public record ApiErrorResponse(
        LocalDateTime timeStamp,
        int status,
        String error,
        String message,
        String path) {
}
