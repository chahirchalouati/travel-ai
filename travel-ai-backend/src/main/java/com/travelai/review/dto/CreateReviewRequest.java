package com.travelai.review.dto;

import java.util.UUID;

public record CreateReviewRequest(
        String targetType,
        UUID targetId,
        short rating,
        Short ratingService,
        Short ratingValue,
        Short ratingCleanliness,
        Short ratingLocation,
        String title,
        String content,
        String photoUrls
) {}
