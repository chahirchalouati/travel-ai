package com.travelai.itinerary.dto;

import java.util.List;
import java.util.UUID;

public record LiveItineraryResponse(
        UUID id,
        UUID bookingId,
        boolean watchEnabled,
        List<SegmentResponse> segments,
        List<ItineraryProposalResponse> pendingProposals
) {
}
