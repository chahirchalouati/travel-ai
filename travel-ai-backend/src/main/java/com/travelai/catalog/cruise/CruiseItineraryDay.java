package com.travelai.catalog.cruise;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import static jakarta.persistence.GenerationType.UUID;

/** One day of a cruise's day-by-day itinerary. */
@Entity
@Table(name = "cruise_itinerary_day")
@Getter
@Setter
public class CruiseItineraryDay {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(name = "cruise_id", nullable = false)
    private java.util.UUID cruiseId;

    @Column(name = "day_number", nullable = false)
    private int dayNumber;

    @Column(nullable = false)
    private String port;

    @Column(columnDefinition = "TEXT")
    private String description;
}
