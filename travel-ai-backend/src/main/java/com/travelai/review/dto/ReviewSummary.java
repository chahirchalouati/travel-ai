package com.travelai.review.dto;

import java.util.UUID;

public record ReviewSummary(
        String targetType,
        UUID targetId,
        double averageRating,
        long totalReviews,
        Double averageService,
        Double averageValue,
        Double averageCleanliness,
        Double averageLocation,
        Ranking ranking,
        String aiSummary
) {
    /**
     * Bayesian-weighted standing of this target among all targets of the same type.
     * rank is 1-based; rankTotal is how many targets have at least one review.
     */
    public record Ranking(int rank, long rankTotal, double score) {}
}
