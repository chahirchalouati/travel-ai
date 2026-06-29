package com.travelai.review;

import com.travelai.auth.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "reviews", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "target_type", "target_id"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "target_type", nullable = false)
    private String targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId;

    @Column(nullable = false)
    private short rating;

    // Optional per-aspect scores (1-5). Null = reviewer skipped the aspect.
    @Column(name = "rating_service")
    private Short ratingService;

    @Column(name = "rating_value")
    private Short ratingValue;

    @Column(name = "rating_cleanliness")
    private Short ratingCleanliness;

    @Column(name = "rating_location")
    private Short ratingLocation;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(columnDefinition = "TEXT")
    private String photoUrls;

    @Builder.Default
    @Column(nullable = false)
    private int helpfulCount = 0;

    @Builder.Default
    @Column(nullable = false)
    private boolean verified = false;

    @Column(columnDefinition = "TEXT")
    private String aiSummaryContribution;

    @Column(updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        this.updatedAt = Instant.now();
    }
}
