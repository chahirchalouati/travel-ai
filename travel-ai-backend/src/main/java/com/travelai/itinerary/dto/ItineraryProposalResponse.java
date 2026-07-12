package com.travelai.itinerary.dto;

import com.travelai.itinerary.ItineraryProposal;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ItineraryProposalResponse(
        UUID id,
        String status,
        String aiSummary,
        Instant expiresAt,
        Instant createdAt,
        List<ProposedChangeResponse> changes
) {
    public static ItineraryProposalResponse from(ItineraryProposal p, List<ProposedChangeResponse> changes) {
        return new ItineraryProposalResponse(
                p.getId(),
                p.getStatus().name(),
                p.getAiSummary(),
                p.getExpiresAt(),
                p.getCreatedAt(),
                changes
        );
    }
}
