package com.travelai.itinerary;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/**
 * Immutable audit record of a detected real-world disruption affecting a segment.
 */
@Entity
@Table(name = "itinerary_events")
@Getter
@Setter
public class ItineraryEvent extends BaseEntity {

    @Column(name = "segment_id", nullable = false)
    private UUID segmentId;

    @Enumerated(STRING)
    @Column(nullable = false)
    private EventSource source;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "disruption_data", columnDefinition = "TEXT")
    private String disruptionData;
}
