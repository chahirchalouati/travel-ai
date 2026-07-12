package com.travelai.event;

import java.math.BigDecimal;
import java.util.UUID;

/** Published by the booking module when a user cancels a booking. */
public record BookingCancelledEvent(
        UUID bookingId,
        UUID userId,
        String userEmail,
        String userName,
        String destination,
        String bookingReference,
        BigDecimal totalPaid,
        BigDecimal refundAmount,
        int refundPercent) {}
