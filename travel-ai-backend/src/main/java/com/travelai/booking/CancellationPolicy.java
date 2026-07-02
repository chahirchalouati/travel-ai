package com.travelai.booking;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Self-service cancellation refund policy.
 *
 * <ul>
 *   <li>Cancelled {@value #FULL_REFUND_MIN_DAYS}+ days before check-in → 100% refund</li>
 *   <li>Between {@value #PARTIAL_REFUND_MIN_DAYS} and {@value #FULL_REFUND_MIN_DAYS} days → 50%</li>
 *   <li>Under {@value #PARTIAL_REFUND_MIN_DAYS} days (including day-of) → no refund</li>
 * </ul>
 *
 * "Check-in" is the booking's start date regardless of vertical: hotel check-in,
 * flight departure day, cruise embarkation or restaurant reservation date — the
 * funnel stores all of them in {@link Booking#getCheckIn()}.
 */
public final class CancellationPolicy {

    public static final int FULL_REFUND_MIN_DAYS = 7;
    public static final int PARTIAL_REFUND_MIN_DAYS = 2;
    public static final int FULL_REFUND_PERCENT = 100;
    public static final int PARTIAL_REFUND_PERCENT = 50;
    public static final int NO_REFUND_PERCENT = 0;

    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    /** One policy tier: bookings cancelled at least {@code minDaysBefore} days out. */
    public record Tier(int minDaysBefore, int refundPercent) {}

    private CancellationPolicy() {
    }

    /** Whole days between today and the booking start date (negative when in the past). */
    public static long daysBeforeStart(LocalDate startDate, LocalDate today) {
        return ChronoUnit.DAYS.between(today, startDate);
    }

    /** Refund percentage for a cancellation happening {@code daysBeforeStart} days out. */
    public static int refundPercent(long daysBeforeStart) {
        if (daysBeforeStart >= FULL_REFUND_MIN_DAYS) {
            return FULL_REFUND_PERCENT;
        }
        if (daysBeforeStart >= PARTIAL_REFUND_MIN_DAYS) {
            return PARTIAL_REFUND_PERCENT;
        }
        return NO_REFUND_PERCENT;
    }

    /** Refund amount for {@code paidAmount} at the given percentage, rounded to cents. */
    public static BigDecimal refundAmount(BigDecimal paidAmount, int refundPercent) {
        if (paidAmount == null || refundPercent <= 0) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return paidAmount
                .multiply(BigDecimal.valueOf(refundPercent))
                .divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP);
    }

    /** The full deadline ladder, most generous tier first (for display purposes). */
    public static List<Tier> tiers() {
        return List.of(
                new Tier(FULL_REFUND_MIN_DAYS, FULL_REFUND_PERCENT),
                new Tier(PARTIAL_REFUND_MIN_DAYS, PARTIAL_REFUND_PERCENT),
                new Tier(0, NO_REFUND_PERCENT));
    }
}
