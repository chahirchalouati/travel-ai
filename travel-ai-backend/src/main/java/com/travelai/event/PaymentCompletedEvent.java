package com.travelai.event;

import java.math.BigDecimal;
import java.util.UUID;

/** Published by the payment module after successful payment. */
public record PaymentCompletedEvent(
        UUID paymentId,
        UUID bookingId,
        UUID userId,
        String userEmail,
        BigDecimal amount,
        String paymentType) {}
