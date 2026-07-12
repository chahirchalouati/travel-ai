package com.travelai.catalog.cruise;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

import static jakarta.persistence.GenerationType.UUID;

/** A bookable cabin tier for a cruise (Interior, Ocean View, Balcony, Suite). */
@Entity
@Table(name = "cruise_cabin_category")
@Getter
@Setter
public class CruiseCabinCategory {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(name = "cruise_id", nullable = false)
    private java.util.UUID cruiseId;

    @Column(nullable = false)
    private String name;

    private String description;

    /** Multiplier applied to the cruise base price per person. */
    @Column(name = "price_multiplier", nullable = false)
    private BigDecimal priceMultiplier;

    @Column(name = "cabins_available")
    private int cabinsAvailable;

    @Column(name = "sort_order")
    private int sortOrder;
}
