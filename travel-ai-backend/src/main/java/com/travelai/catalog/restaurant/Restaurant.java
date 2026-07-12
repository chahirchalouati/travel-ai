package com.travelai.catalog.restaurant;

import com.travelai.partner.Partner;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "restaurants")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Restaurant {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

    @Column(nullable = false)
    private String name;

    private String cuisineType;

    private Short priceTier;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String city;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private boolean petFriendly;

    private boolean accessible;

    private String imageUrl;

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
