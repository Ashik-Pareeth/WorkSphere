package com.ucocs.worksphere.exception;

import com.ucocs.worksphere.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

        @ExceptionHandler(ResourceNotFoundException.class)
        public ResponseEntity<ApiErrorResponse> handleResourceNotFoundException(
                ResourceNotFoundException ex, HttpServletRequest request) {
                return build(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), request);
        }

        @ExceptionHandler(IllegalArgumentException.class)
        public ResponseEntity<ApiErrorResponse> handleIllegalArgument(
                IllegalArgumentException ex, HttpServletRequest request) {
                return build(HttpStatus.BAD_REQUEST, "Bad Request", ex.getMessage(), request);
        }

        @ExceptionHandler(IllegalStateException.class)
        public ResponseEntity<ApiErrorResponse> handleIllegalState(
                IllegalStateException ex, HttpServletRequest request) {
                return build(HttpStatus.CONFLICT, "Conflict", ex.getMessage(), request);
        }

        @ExceptionHandler(org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class)
        public ResponseEntity<ApiErrorResponse> handleTypeMismatch(
                Exception ex, HttpServletRequest request) {
                return build(HttpStatus.BAD_REQUEST, "Invalid Parameter", "Invalid parameter format.", request);
        }

        @ExceptionHandler(org.springframework.web.bind.MissingServletRequestParameterException.class)
        public ResponseEntity<ApiErrorResponse> handleMissingParams(
                org.springframework.web.bind.MissingServletRequestParameterException ex,
                HttpServletRequest request) {
                return build(HttpStatus.BAD_REQUEST, "Missing Parameter",
                        "Required parameter '" + ex.getParameterName() + "' is missing.", request);
        }

        @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
        public ResponseEntity<ApiErrorResponse> handleHttpMessageNotReadable(
                org.springframework.http.converter.HttpMessageNotReadableException ex,
                HttpServletRequest request) {
                return build(HttpStatus.BAD_REQUEST, "Malformed JSON Request",
                        "The request body is missing required fields or contains invalid data formats.", request);
        }

        @ExceptionHandler(org.springframework.web.bind.MethodArgumentNotValidException.class)
        public ResponseEntity<ApiErrorResponse> handleValidationException(
                org.springframework.web.bind.MethodArgumentNotValidException ex,
                HttpServletRequest request) {

                List<String> errors = ex.getBindingResult()
                        .getFieldErrors()
                        .stream()
                        .map(FieldError::getDefaultMessage)
                        .toList();

                return ResponseEntity.badRequest().body(
                        ApiErrorResponse.ofErrors(HttpStatus.BAD_REQUEST.value(), "Validation Failed", errors, request.getRequestURI())
                );
        }

        @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
        public ResponseEntity<ApiErrorResponse> handleMaxUploadSizeExceeded(
                org.springframework.web.multipart.MaxUploadSizeExceededException ex,
                HttpServletRequest request) {

                return build(
                        HttpStatus.CONTENT_TOO_LARGE,
                        "File Too Large",
                        "Uploaded file exceeds the maximum allowed size (5MB).",
                        request
                );
        }

        @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
        public ResponseEntity<ApiErrorResponse> handleMethodNotSupported(
                org.springframework.web.HttpRequestMethodNotSupportedException ex,
                HttpServletRequest request) {
                return build(HttpStatus.METHOD_NOT_ALLOWED, "Method Not Allowed", ex.getMessage(), request);
        }

        @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
        public ResponseEntity<ApiErrorResponse> handleDatabaseConflict(
                Exception ex, HttpServletRequest request) {
                return build(HttpStatus.CONFLICT, "Database Conflict", "Operation violates database constraints.", request);
        }

        @ExceptionHandler(ServiceOperationException.class)
        public ResponseEntity<ApiErrorResponse> handleServiceOperationException(
                ServiceOperationException ex, HttpServletRequest request) {
                log.error("Service operation failed at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
                return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error", ex.getMessage(), request);
        }

        @ExceptionHandler({
                AuthorizationDeniedException.class,
                org.springframework.security.access.AccessDeniedException.class
        })
        public ResponseEntity<ApiErrorResponse> handleAccessDenied(
                Exception ex, HttpServletRequest request) {
                // Preserve the real message (e.g. department jurisdiction errors from service layer)
                String message = (ex.getMessage() != null && !ex.getMessage().isBlank())
                        ? ex.getMessage()
                        : "You do not have permission to access this resource.";
                return build(HttpStatus.FORBIDDEN, "Forbidden", message, request);
        }

        @ExceptionHandler(Exception.class)
        public ResponseEntity<ApiErrorResponse> handleGeneralException(
                Exception ex, HttpServletRequest request) {
                log.error("Unhandled exception at {}: {}", request.getRequestURI(), ex.getMessage(), ex);
                return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                        "An unexpected error occurred. Please try again later.", request);
        }

        // --- Helper ---
        private ResponseEntity<ApiErrorResponse> build(
                HttpStatus status, String error, String message, HttpServletRequest request) {
                return ResponseEntity.status(status).body(
                        ApiErrorResponse.of(status.value(), error, message, request.getRequestURI())
                );
        }
}
