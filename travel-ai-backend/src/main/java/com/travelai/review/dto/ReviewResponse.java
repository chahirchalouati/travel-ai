package com.travelai.review.dto;

import com.travelai.review.Review;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID userId,
        String userFirstName,
        String userAvatarUrl,
        String targetType,
        UUID targetId,
        short rating,
        Short ratingService,
        Short ratingValue,
        Short ratingCleanliness,
        Short ratingLocation,
        String title,
        String content,
        String photoUrls,
        int helpfulCount,
        boolean helpfulByMe,
        boolean verified,
        Instant createdAt
) {

    public static ReviewResponse from(Review review) {
        return from(review, false);
    }

    public static ReviewResponse from(Review review, boolean helpfulByMe) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getFirstName(),
                review.getUser().getAvatarUrl(),
                review.getTargetType(),
                review.getTargetId(),
                review.getRating(),
                review.getRatingService(),
                review.getRatingValue(),
                review.getRatingCleanliness(),
                review.getRatingLocation(),
                review.getTitle(),
                review.getContent(),
                review.getPhotoUrls(),
                review.getHelpfulCount(),
                helpfulByMe,
                review.isVerified(),
                review.getCreatedAt()
        );
    }
}
