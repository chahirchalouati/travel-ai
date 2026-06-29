package com.travelai.itinerary;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Reactive state for one confirmed booking. Created when a booking is confirmed.
 */
@Entity
@Table(name = "live_itineraries")
@Getter
@Setter
public class LiveItinerary extends BaseEntity {

    @Column(name = "booking_id", nullable = false, unique = true)
    private UUID bookingId;

    @Column(name = "watch_enabled", nullable = false)
    private boolean watchEnabled = true;

    @Column(name = "last_checked_at")
    private Instant lastCheckedAt;
}
