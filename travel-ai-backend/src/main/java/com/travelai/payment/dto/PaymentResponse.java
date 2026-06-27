package com.travelai.payment.dto;

import com.travelai.payment.PaymentGateway;
import com.travelai.payment.PaymentStatus;
import com.travelai.payment.PaymentType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record PaymentResponse(
        UUID id,
        UUID bookingId,
        PaymentStatus status,
        PaymentType type,
        PaymentGateway gateway,
        BigDecimal amount,
        String currency,
        String gatewayReference,
        String gatewayCheckoutUrl,
        LocalDateTime paidAt,
        Instant createdAt
) {}
