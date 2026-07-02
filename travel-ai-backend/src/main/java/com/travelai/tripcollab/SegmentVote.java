package com.travelai.tripcollab;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/** One user's UP/DOWN vote on an itinerary segment. Unique per (segment, user). */
@Entity
@Table(name = "segment_vote",
        uniqueConstraints = @UniqueConstraint(name = "uq_segment_vote", columnNames = {"segment_id", "user_id"}))
@Getter
@Setter
public class SegmentVote extends BaseEntity {

    @Column(name = "segment_id", nullable = false)
    private UUID segmentId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(STRING)
    @Column(nullable = false)
    private VoteValue vote;
}
