package com.travelai.stories;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

import static jakarta.persistence.GenerationType.UUID;

@Entity
@Table(name = "travel_stories")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TravelStory {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(nullable = false)
    private String place;

    @Column(nullable = false)
    private String country;

    private String tag;

    @Builder.Default
    private int minutes = 0;

    @Column(name = "poster_url", nullable = false)
    private String posterUrl;

    @Column(name = "video_url")
    private String videoUrl;

    @Builder.Default
    private boolean featured = false;

    @Builder.Default
    private int sortOrder = 0;

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
