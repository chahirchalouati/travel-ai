package com.travelai.destination.dto;

import java.util.UUID;

public record DestinationGuide(
        UUID destinationId,
        String name,
        String guide,
        String topAttractions,
        String foodRecommendations,
        String travelTips
) {}
