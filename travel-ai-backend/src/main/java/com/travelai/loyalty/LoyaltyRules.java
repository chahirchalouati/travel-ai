package com.travelai.loyalty;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * The loyalty program rulebook. Kept as pure static functions so earn/redeem
 * math is trivially unit-testable and mirrored by the frontend.
 *
 * <ul>
 *   <li>Earn: 1 point per EUR paid, times the tier multiplier, floored.</li>
 *   <li>Redeem: 100 points = 1 EUR, minimum 500 points per redemption,
 *       discount capped at 50% of the booking total.</li>
 * </ul>
 */
public final class LoyaltyRules {

    /** Base earn rate: points per EUR paid (before tier multiplier). */
    public static final int EARN_POINTS_PER_EUR = 1;
    /** Redemption exchange rate: this many points buy 1 EUR of discount. */
    public static final int POINTS_PER_EUR = 100;
    /** A redemption must spend at least this many points. */
    public static final int MIN_REDEEM_POINTS = 500;
    /** Combined checkout discounts may not exceed this share of the total. */
    public static final BigDecimal MAX_DISCOUNT_RATIO = new BigDecimal("0.50");

    private LoyaltyRules() {
    }

    /** Points earned for a paid amount at the given tier: floor(amount × rate × multiplier). */
    public static int earnedPoints(BigDecimal amountPaid, LoyaltyTier tier) {
        if (amountPaid == null || amountPaid.signum() <= 0) {
            return 0;
        }
        return amountPaid
                .multiply(BigDecimal.valueOf(EARN_POINTS_PER_EUR))
                .multiply(tier.getEarnMultiplier())
                .setScale(0, RoundingMode.FLOOR)
                .intValueExact();
    }

    /** EUR discount bought by the given points (100 pts = 1 EUR). */
    public static BigDecimal discountFor(int points) {
        return BigDecimal.valueOf(points)
                .divide(BigDecimal.valueOf(POINTS_PER_EUR), 2, RoundingMode.DOWN);
    }

    /**
     * Most points redeemable against a booking total, honouring the balance,
     * the 50% discount cap and the 500-point minimum (returns 0 below it).
     */
    public static int maxRedeemablePoints(BigDecimal bookingTotal, int pointsBalance) {
        if (bookingTotal == null || bookingTotal.signum() <= 0 || pointsBalance <= 0) {
            return 0;
        }
        int capPoints = bookingTotal
                .multiply(MAX_DISCOUNT_RATIO)
                .multiply(BigDecimal.valueOf(POINTS_PER_EUR))
                .setScale(0, RoundingMode.FLOOR)
                .intValueExact();
        int redeemable = Math.min(pointsBalance, capPoints);
        return redeemable >= MIN_REDEEM_POINTS ? redeemable : 0;
    }
}
