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
     * A rank of 0 means the target has no reviews yet and is not ranked.
     */
    public record Ranking(int rank, long rankTotal, double score) {

        /** Sentinel returned when ranking data is unavailable (no reviews yet). */
        public static Ranking unranked(long rankTotal) {
            return new Ranking(0, rankTotal, 0.0);
        }

        /** Convenience factory for the fully-empty case (no reviews for this type at all). */
        public static Ranking empty() {
            return new Ranking(0, 0, 0.0);
        }
    }
}
