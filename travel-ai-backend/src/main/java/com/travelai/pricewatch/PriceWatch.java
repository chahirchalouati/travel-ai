package com.travelai.pricewatch;

import com.travelai.auth.User;
import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

import static jakarta.persistence.FetchType.LAZY;

/** A user's request to be alerted when a flight or cruise drops in price. */
@Entity
@Table(name = "price_watch")
@Getter
@Setter
public class PriceWatch extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "flight_id")
    private UUID flightId;

    @Column(name = "cruise_id")
    private UUID cruiseId;

    /** Human-readable label for the watched item (route or cruise name). */
    @Column(nullable = false)
    private String label;

    /** Price observed at creation / last check — the baseline for a drop. */
    @Column(name = "last_price", nullable = false)
    private BigDecimal lastPrice;

    /** Optional threshold: only alert when the price reaches or drops below this. */
    @Column(name = "target_price")
    private BigDecimal targetPrice;

    /** Price at which the last alert was sent, so we don't re-alert the same drop. */
    @Column(name = "last_notified_price")
    private BigDecimal lastNotifiedPrice;

    @Column(nullable = false)
    private boolean active = true;
}
