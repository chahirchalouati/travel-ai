package com.travelai.payment.dto;

import com.travelai.payment.Payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record AdminPaymentResponse(
        UUID id,
        UUID bookingId,
        String userEmail,
        String status,
        String type,
        String gateway,
        BigDecimal amount,
        String currency,
        String gatewayReference,
        LocalDateTime paidAt,
        LocalDateTime refundedAt,
        String failureReason,
        Instant createdAt) {

    public static AdminPaymentResponse from(Payment p) {
        return new AdminPaymentResponse(
                p.getId(),
                p.getBookingId(),
                p.getUser() != null ? p.getUser().getEmail() : null,
                p.getStatus() != null ? p.getStatus().name() : null,
                p.getType() != null ? p.getType().name() : null,
                p.getGateway() != null ? p.getGateway().name() : null,
                p.getAmount(),
                p.getCurrency(),
                p.getGatewayReference(),
                p.getPaidAt(),
                p.getRefundedAt(),
                p.getFailureReason(),
                p.getCreatedAt());
    }
}
