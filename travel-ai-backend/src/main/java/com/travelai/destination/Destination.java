package com.travelai.destination;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "destinations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Destination {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String country;

    private String continent;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String galleryUrls;

    @Column(name = "guide_text", columnDefinition = "TEXT")
    private String guideText;

    @Column(name = "top_attractions", columnDefinition = "TEXT")
    private String topAttractions;

    @Column(name = "food_recommendations", columnDefinition = "TEXT")
    private String foodRecommendations;

    @Column(name = "travel_tips", columnDefinition = "TEXT")
    private String travelTips;

    private String tags;

    private String climate;

    private String bestMonths;

    private BigDecimal avgDailyCost;

    private String currency;

    private String language;

    private String timezone;

    private BigDecimal latitude;

    private BigDecimal longitude;

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
