package com.travelai.subscription.dto;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * The caller's membership status and its active benefits. When {@code active} is
 * false the plan fields describe the plan they could subscribe to (or are null if
 * no plan is offered).
 */
public record MembershipResponse(
        boolean active,
        String planCode,
        String planName,
        Instant startedAt,
        Instant renewsAt,
        boolean serviceFeeWaived,
        BigDecimal memberDiscountPct) {

    public static MembershipResponse inactive() {
        return new MembershipResponse(false, null, null, null, null, false, BigDecimal.ZERO);
    }
}
