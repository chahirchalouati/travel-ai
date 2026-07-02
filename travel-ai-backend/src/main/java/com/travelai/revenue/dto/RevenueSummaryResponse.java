package com.travelai.revenue.dto;

import java.math.BigDecimal;

/**
 * Platform revenue rolled up across every income stream. {@code grossBookingValue}
 * is the total customers paid; the remaining amounts are the platform's own take.
 * {@code totalPlatformRevenue} = service fees + commission + ancillary + subscription.
 */
public record RevenueSummaryResponse(
        long confirmedBookings,
        BigDecimal grossBookingValue,
        BigDecimal serviceFeeRevenue,
        BigDecimal commissionRevenue,
        BigDecimal ancillaryRevenue,
        long activeSubscriptions,
        BigDecimal subscriptionRevenue,
        BigDecimal totalPlatformRevenue) {}
