package com.travelai.destination.dto;

public record ContinentSummary(
        String continent,
        long destinationCount,
        String imageUrl
) {}
