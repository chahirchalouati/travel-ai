package com.travelai.catalog.flight;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Authoritative IATA → city/country reference, used to enrich flight results so
 * the UI can group destinations by country and city. Seeded by migration V34.
 */
@Entity
@Table(name = "airports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Airport {

    @Id
    @Column(length = 3, nullable = false)
    private String iata;

    @Column(nullable = false, length = 120)
    private String city;

    /** Proper airport name (e.g. "Fiumicino"), null when no widely-known name exists. */
    @Column(length = 120)
    private String name;

    @Column(nullable = false, length = 120)
    private String country;

    @Column(name = "country_code", length = 2, nullable = false)
    private String countryCode;

}
