package com.travelai.itinerary;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/**
 * One per-segment diff inside an {@link ItineraryProposal}: what would change and the cost impact.
 */
@Entity
@Table(name = "proposed_changes")
@Getter
@Setter
public class ProposedChange extends BaseEntity {

    @Column(name = "proposal_id", nullable = false)
    private UUID proposalId;

    @Column(name = "segment_id", nullable = false)
    private UUID segmentId;

    @Enumerated(STRING)
    @Column(name = "change_type", nullable = false)
    private ProposedChangeType changeType;

    @Column(name = "replacement_entity_id")
    private UUID replacementEntityId;

    @Column(name = "replacement_label")
    private String replacementLabel;

    @Column(name = "cost_delta")
    private BigDecimal costDelta;

    @Column(name = "ai_rationale", columnDefinition = "TEXT")
    private String aiRationale;
}
