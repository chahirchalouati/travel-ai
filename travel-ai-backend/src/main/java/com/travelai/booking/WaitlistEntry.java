package com.travelai.booking;

import com.travelai.auth.User;
import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(name = "waitlist_entries")
@Getter
@Setter
public class WaitlistEntry extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private UUID hotelId;
    private UUID restaurantId;
    private UUID flightId;

    private LocalDateTime requestedAt = LocalDateTime.now();
    private boolean notified = false;
    private LocalDateTime notifiedAt;
}
