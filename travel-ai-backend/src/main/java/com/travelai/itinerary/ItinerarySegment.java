package com.travelai.itinerary;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/**
 * One bookable component of a trip (a flight, a hotel stay, a restaurant booking).
 * {@code currentStatus} mirrors the real-world state of that component.
 */
@Entity
@Table(name = "itinerary_segments")
@Getter
@Setter
public class ItinerarySegment extends BaseEntity {

    @Column(name = "itinerary_id", nullable = false)
    private UUID itineraryId;

    @Enumerated(STRING)
    @Column(name = "segment_type", nullable = false)
    private SegmentType segmentType;

    @Column(name = "entity_id", nullable = false)
    private UUID entityId;

    private String label;

    @Enumerated(STRING)
    @Column(name = "current_status", nullable = false)
    private SegmentStatus currentStatus = SegmentStatus.ON_SCHEDULE;

    @Column(name = "scheduled_at")
    private Instant scheduledAt;
}
