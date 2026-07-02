package com.travelai.tripcollab;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/**
 * A travel companion on a trip. {@code tripId} is the booking id (the id used
 * by /trips/:id/live). {@code userId} stays null until the invite is accepted.
 */
@Entity
@Table(name = "trip_member")
@Getter
@Setter
public class TripMember extends BaseEntity {

    @Column(name = "trip_id", nullable = false)
    private UUID tripId;

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "invited_email", nullable = false)
    private String invitedEmail;

    @Enumerated(STRING)
    @Column(nullable = false)
    private TripRole role = TripRole.VIEWER;

    @Enumerated(STRING)
    @Column(nullable = false)
    private TripMemberStatus status = TripMemberStatus.PENDING;

    @Column(name = "invite_token", nullable = false, unique = true)
    private String inviteToken;

    @Column(name = "responded_at")
    private Instant respondedAt;
}
