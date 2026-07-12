package com.travelai.attraction;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "attractions")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Attraction {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String name;

    /** LANDMARK | MUSEUM | PARK | TOUR | ACTIVITY | NATURE | NIGHTLIFE | SHOPPING | FOOD | BEACH */
    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private String city;

    private String country;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;

    private BigDecimal latitude;

    private BigDecimal longitude;

    /** FREE | LOW | MEDIUM | HIGH */
    @Column(name = "price_level", nullable = false)
    @Builder.Default
    private String priceLevel = "FREE";

    /** Populated when {@link #bookable} — the from-price for a tour/activity. */
    private BigDecimal basePrice;

    private Integer durationMinutes;

    @Builder.Default
    private boolean bookable = false;

    private String tags;

    @Builder.Default
    private int popularityScore = 0;

    @Builder.Default
    private boolean featured = false;

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
