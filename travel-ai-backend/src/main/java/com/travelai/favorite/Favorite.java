package com.travelai.favorite;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

/**
 * Persisted wishlist entry for a single user/entity combination.
 * entityType is stored uppercase (e.g. "HOTEL", "FLIGHT", "RESTAURANT",
 * "ATTRACTION", "CRUISE"). entityId is a String to handle both UUID-keyed
 * and numeric-keyed catalog entities without loss of fidelity.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(
        name = "favorites",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_favorite_user_type_entity",
                columnNames = {"user_id", "entity_type", "entity_id"}
        )
)
public class Favorite extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    /** Uppercase catalog type: HOTEL, FLIGHT, RESTAURANT, ATTRACTION, CRUISE. */
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    /** The catalog entity's primary-key value, stored as a string. */
    @Column(name = "entity_id", nullable = false, length = 100)
    private String entityId;

    /** Display title captured at save time so the favorites page needs no refetch. */
    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "subtitle")
    private String subtitle;

    @Column(name = "image_url")
    private String imageUrl;

    /** Client-side router path to the item's detail page. */
    @Column(name = "route", nullable = false)
    private String route;
}
