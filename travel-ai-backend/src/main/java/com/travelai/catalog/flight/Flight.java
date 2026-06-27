package com.travelai.catalog.flight;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "flights")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Flight {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    private String airline;

    private String flightNumber;

    @Column(nullable = false, length = 3)
    private String originIata;

    @Column(nullable = false, length = 3)
    private String destIata;

    @Column(nullable = false)
    private Instant departureAt;

    @Column(nullable = false)
    private Instant arrivalAt;

    @Column(nullable = false)
    private BigDecimal price;

    @Column(nullable = false)
    private short seatsAvailable;

    @Builder.Default
    private boolean baggageIncluded = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(updatable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        this.createdAt = Instant.now();
    }
}
