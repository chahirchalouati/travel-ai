package com.travelai.destination.dto;

public record InterestSummary(
        String key,
        String tag,
        String icon,
        long destinationCount,
        String imageUrl
) {}
