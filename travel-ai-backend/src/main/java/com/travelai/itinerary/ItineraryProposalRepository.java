package com.travelai.itinerary;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ItineraryProposalRepository extends JpaRepository<ItineraryProposal, UUID> {

    List<ItineraryProposal> findByItineraryIdOrderByCreatedAtDesc(UUID itineraryId);

    List<ItineraryProposal> findByItineraryIdAndStatus(UUID itineraryId, ItineraryProposalStatus status);

    List<ItineraryProposal> findByStatusAndExpiresAtBefore(ItineraryProposalStatus status, Instant cutoff);
}
