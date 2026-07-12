package com.travelai.favorite.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddFavoriteRequest(
        @NotBlank @Size(max = 50) String entityType,
        @NotBlank @Size(max = 100) String entityId,
        @NotBlank @Size(max = 255) String title,
        @Size(max = 255) String subtitle,
        @Size(max = 1000) String imageUrl,
        @NotBlank @Size(max = 500) String route
) {}
