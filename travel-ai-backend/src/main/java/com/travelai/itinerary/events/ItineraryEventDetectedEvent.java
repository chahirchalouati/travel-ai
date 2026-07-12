package com.travelai.itinerary.events;

import java.util.UUID;

/**
 * Published whenever a disruption is recorded against a segment (manual / poll / webhook).
 * Single entry point to the re-plan listener.
 */
public record ItineraryEventDetectedEvent(
        UUID eventId,
        UUID segmentId,
        UUID itineraryId,
        String userEmail,
        String source) {}
