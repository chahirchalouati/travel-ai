package com.travelai.booking;

import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;

/** A refund issued when a user cancels a booking, per {@link CancellationPolicy}. */
@Entity
@Table(name = "refund")
@Getter
@Setter
public class Refund extends BaseEntity {

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Column(name = "payment_id")
    private UUID paymentId;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(name = "refund_percent", nullable = false)
    private int refundPercent;

    @jakarta.persistence.Enumerated(STRING)
    @Column(nullable = false)
    private RefundStatus status = RefundStatus.PENDING;

    @Column(columnDefinition = "text")
    private String reason;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
