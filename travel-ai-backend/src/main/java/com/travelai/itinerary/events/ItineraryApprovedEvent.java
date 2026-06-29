package com.travelai.itinerary.events;

import java.util.UUID;

/** Published when a user approves a re-plan proposal. */
public record ItineraryApprovedEvent(
        UUID proposalId,
        UUID itineraryId,
        String userEmail) {}
