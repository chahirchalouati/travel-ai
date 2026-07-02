package com.travelai.subscription;

import com.travelai.auth.User;
import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

import static jakarta.persistence.EnumType.STRING;
import static jakarta.persistence.FetchType.LAZY;

/** A user's membership. At most one ACTIVE row per user at a time. */
@Entity
@Table(name = "user_subscription")
@Getter
@Setter
public class UserSubscription extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "plan_code", nullable = false)
    private String planCode;

    @Enumerated(STRING)
    @Column(nullable = false)
    private SubscriptionStatus status = SubscriptionStatus.ACTIVE;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt = Instant.now();

    @Column(name = "renews_at")
    private Instant renewsAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "price_paid", nullable = false, precision = 12, scale = 2)
    private BigDecimal pricePaid;

    @Column(nullable = false)
    private String currency = "EUR";
}
