package com.travelai.catalog.cruise;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "cruises")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Cruise {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String operator;

    @Column(nullable = false)
    private String name;

    private String shipName;

    @Column(nullable = false)
    private String departurePort;

    private String arrivalPort;

    private LocalDate departureDate;

    private LocalDate returnDate;

    private int durationNights;

    @Column(nullable = false)
    private BigDecimal pricePerPerson;

    @Builder.Default
    private int cabinsAvailable = 0;

    private String cruiseType;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;

    private String itinerary;

    @Builder.Default
    private boolean allInclusive = false;

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
