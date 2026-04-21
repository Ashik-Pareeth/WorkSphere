package com.ucocs.worksphere.exception;

public class ServiceOperationException extends RuntimeException {
    public ServiceOperationException(String message, Throwable cause) {
        super(message, cause);
    }
}
