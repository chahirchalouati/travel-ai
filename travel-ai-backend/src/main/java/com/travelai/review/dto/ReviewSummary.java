package com.travelai.review.dto;

import java.util.UUID;

public record ReviewSummary(
        String targetType,
        UUID targetId,
        double averageRating,
        long totalReviews,
        String aiSummary
) {}
