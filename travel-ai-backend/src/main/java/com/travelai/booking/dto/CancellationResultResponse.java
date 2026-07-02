package com.travelai.booking.dto;

import com.travelai.booking.RefundStatus;

import java.math.BigDecimal;

/** Outcome of a self-service cancellation: updated booking + refund breakdown. */
public record CancellationResultResponse(
        BookingResponse booking,
        BigDecimal refundAmount,
        int refundPercent,
        RefundStatus refundStatus) {}
