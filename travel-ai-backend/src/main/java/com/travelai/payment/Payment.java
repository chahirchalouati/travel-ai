package com.travelai.payment;

import com.travelai.auth.User;
import com.travelai.shared.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import static jakarta.persistence.EnumType.STRING;
import static jakarta.persistence.FetchType.LAZY;

@Entity
@Table(name = "payments")
@Getter
@Setter
public class Payment extends BaseEntity {

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "booking_id", nullable = false)
    private UUID bookingId;

    @Enumerated(STRING)
    private PaymentStatus status = PaymentStatus.PENDING;

    @Enumerated(STRING)
    private PaymentType type;

    @Enumerated(STRING)
    private PaymentGateway gateway;

    @Column(nullable = false)
    private BigDecimal amount;

    @Column(length = 3)
    private String currency = "EUR";

    private String gatewayReference;
    private String gatewayCheckoutUrl;

    private LocalDateTime paidAt;
    private LocalDateTime refundedAt;

    @Column(columnDefinition = "text")
    private String failureReason;
}
