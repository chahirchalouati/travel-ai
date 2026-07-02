package com.travelai.booking;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

import static jakarta.persistence.FetchType.LAZY;

/**
 * A purchased add-on line item on a booking. Prices are snapshotted at purchase
 * time (resolved server-side from the ancillary catalogue) so later catalogue
 * changes never rewrite historical revenue.
 */
@Entity
@Table(name = "booking_ancillary")
@Getter
@Setter
public class BookingAncillary extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "booking_id", nullable = false)
    private Booking booking;

    @Column(nullable = false)
    private String code;

    @Column(nullable = false)
    private String label;

    @Column(name = "unit_price", nullable = false, precision = 12, scale = 2)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private int quantity = 1;

    @Column(nullable = false)
    private String currency = "EUR";
}
