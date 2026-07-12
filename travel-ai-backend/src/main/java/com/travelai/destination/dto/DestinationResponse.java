package com.travelai.destination.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record DestinationResponse(
        UUID id,
        String name,
        String country,
        String continent,
        String description,
        String imageUrl,
        String galleryUrls,
        String tags,
        String climate,
        String bestMonths,
        BigDecimal avgDailyCost,
        String currency,
        String language,
        int popularityScore,
        boolean featured
) {}
