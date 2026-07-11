package com.travelai.ai.planning.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.List;

/**
 * A natural, lightweight brief for the AI trip planner. Only {@code destination}
 * is required; everything else has sensible defaults so a one-line request still
 * produces a full itinerary.
 */
public record ItineraryPlanRequest(
        @NotBlank String destination,
        /** Number of itinerary days; defaulted and clamped server-side. */
        Integer days,
        Integer adults,
        Integer children,
        /** Optional overall budget; when present it steers the hotel/restaurant/flight picks. */
        BigDecimal budget,
        /** Free-text interests ("art", "food", "family") used as planning constraints. */
        List<String> interests
) {
}
