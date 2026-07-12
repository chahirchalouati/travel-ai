package com.travelai.favorite.dto;

import com.travelai.favorite.Favorite;

import java.time.Instant;
import java.util.UUID;

public record FavoriteResponse(
        UUID id,
        String entityType,
        String entityId,
        String title,
        String subtitle,
        String imageUrl,
        String route,
        Instant savedAt
) {
    public static FavoriteResponse from(Favorite f) {
        return new FavoriteResponse(
                f.getId(),
                f.getEntityType(),
                f.getEntityId(),
                f.getTitle(),
                f.getSubtitle(),
                f.getImageUrl(),
                f.getRoute(),
                f.getCreatedAt()
        );
    }
}
