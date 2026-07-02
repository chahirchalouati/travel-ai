package com.travelai.booking.dto;

import com.travelai.booking.CancellationPolicy;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/** Refund quote for cancelling a booking now, without actually cancelling it. */
public record CancellationPreviewResponse(
        UUID bookingId,
        boolean cancellable,
        String notCancellableReason,
        LocalDate checkIn,
        long daysBeforeCheckIn,
        BigDecimal totalPaid,
        int refundPercent,
        BigDecimal refundAmount,
        List<CancellationPolicy.Tier> tiers) {}
