package com.ucocs.worksphere.dto;

public record TaskRatingRequest(
        Integer rating // 1 to 5
) {
    public TaskRatingRequest {
        if (rating != null && (rating < 1 || rating > 5)) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
    }
}