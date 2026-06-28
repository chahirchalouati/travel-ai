package com.travelai.review.dto;

import com.travelai.review.Review;

import java.time.Instant;
import java.util.UUID;

public record ReviewResponse(
        UUID id,
        UUID userId,
        String userFirstName,
        String targetType,
        UUID targetId,
        short rating,
        String title,
        String content,
        String photoUrls,
        int helpfulCount,
        boolean verified,
        Instant createdAt
) {

    public static ReviewResponse from(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getUser().getId(),
                review.getUser().getFirstName(),
                review.getTargetType(),
                review.getTargetId(),
                review.getRating(),
                review.getTitle(),
                review.getContent(),
                review.getPhotoUrls(),
                review.getHelpfulCount(),
                review.isVerified(),
                review.getCreatedAt()
        );
    }
}
