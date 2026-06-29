package com.travelai.itinerary.dto;

import java.util.UUID;

/**
 * A user-reported disruption against one segment of their live itinerary.
 */
public record ReportEventRequest(
        UUID segmentId,
        String description,
        String disruptionData
) {
}
