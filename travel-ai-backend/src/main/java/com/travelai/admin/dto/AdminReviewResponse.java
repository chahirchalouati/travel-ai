package com.travelai.admin.dto;

import com.travelai.review.Review;

import java.time.Instant;
import java.util.UUID;

public record AdminReviewResponse(
        UUID id,
        String authorName,
        String authorEmail,
        String targetType,
        UUID targetId,
        int rating,
        String title,
        String content,
        boolean verified,
        Instant createdAt) {

    public static AdminReviewResponse from(Review r) {
        String name = r.getUser() != null
                ? (safe(r.getUser().getFirstName()) + " " + safe(r.getUser().getLastName())).trim()
                : "Unknown";
        String email = r.getUser() != null ? r.getUser().getEmail() : null;
        return new AdminReviewResponse(
                r.getId(), name.isBlank() ? "Unknown" : name, email,
                r.getTargetType(), r.getTargetId(), r.getRating(),
                r.getTitle(), r.getContent(), r.isVerified(), r.getCreatedAt());
    }

    private static String safe(String s) { return s == null ? "" : s; }
}
