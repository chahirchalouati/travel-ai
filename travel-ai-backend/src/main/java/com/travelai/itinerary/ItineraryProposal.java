package com.travelai.itinerary;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/**
 * An AI-generated re-plan for one or more affected segments, awaiting user approval.
 */
@Entity
@Table(name = "itinerary_proposals")
@Getter
@Setter
public class ItineraryProposal extends BaseEntity {

    @Column(name = "itinerary_id", nullable = false)
    private UUID itineraryId;

    @Column(name = "triggering_event_id")
    private UUID triggeringEventId;

    @Enumerated(STRING)
    @Column(nullable = false)
    private ItineraryProposalStatus status = ItineraryProposalStatus.PENDING_APPROVAL;

    @Column(name = "ai_summary", columnDefinition = "TEXT")
    private String aiSummary;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "resolved_at")
    private Instant resolvedAt;
}
