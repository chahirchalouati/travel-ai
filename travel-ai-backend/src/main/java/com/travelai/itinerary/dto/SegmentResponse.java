package com.travelai.itinerary.dto;

import com.travelai.itinerary.ItinerarySegment;

import java.time.Instant;
import java.util.UUID;

public record SegmentResponse(
        UUID id,
        String segmentType,
        UUID entityId,
        String label,
        String currentStatus,
        Instant scheduledAt
) {
    public static SegmentResponse from(ItinerarySegment s) {
        return new SegmentResponse(
                s.getId(),
                s.getSegmentType().name(),
                s.getEntityId(),
                s.getLabel(),
                s.getCurrentStatus().name(),
                s.getScheduledAt()
        );
    }
}
