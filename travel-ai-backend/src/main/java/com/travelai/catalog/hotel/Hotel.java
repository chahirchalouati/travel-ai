package com.travelai.catalog.hotel;

import com.travelai.partner.Partner;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "hotels")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Hotel {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;

    @Column(nullable = false)
    private String name;

    private Short stars;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String city;

    private BigDecimal latitude;

    private BigDecimal longitude;

    private boolean petFriendly;

    private boolean accessible;

    private boolean familyFriendly;

    private boolean seaProximity;

    private String imageUrl;

    private BigDecimal basePriceNight;

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
