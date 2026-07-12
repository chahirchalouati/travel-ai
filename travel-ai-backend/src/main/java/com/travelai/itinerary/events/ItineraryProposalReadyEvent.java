package com.travelai.itinerary.events;

import java.util.UUID;

/** Published when an AI re-plan proposal has been persisted and is ready for the user. */
public record ItineraryProposalReadyEvent(
        UUID proposalId,
        UUID itineraryId,
        UUID userId,
        String userEmail,
        String summary) {}
