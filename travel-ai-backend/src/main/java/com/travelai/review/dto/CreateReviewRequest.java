package com.travelai.review.dto;

import java.util.UUID;

public record CreateReviewRequest(
        String targetType,
        UUID targetId,
        short rating,
        String title,
        String content,
        String photoUrls
) {}
