package com.travelai.featureflag;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

import static jakarta.persistence.GenerationType.UUID;

/** A named on/off toggle for gating features without a redeploy. */
@Entity
@Table(name = "feature_flags")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeatureFlag {

    @Id
    @GeneratedValue(strategy = UUID)
    private java.util.UUID id;

    @Column(name = "flag_key", nullable = false, unique = true)
    private String key;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = false;

    @Column(columnDefinition = "text")
    private String description;

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
