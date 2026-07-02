package com.travelai.loyalty;

import java.math.BigDecimal;

/**
 * Loyalty tiers, ordered from entry to top. A member's tier is derived from
 * lifetime points; higher tiers earn points faster.
 */
public enum LoyaltyTier {

    EXPLORER(0, new BigDecimal("1.00")),
    VOYAGER(1_000, new BigDecimal("1.25")),
    ELITE(5_000, new BigDecimal("1.50"));

    private final int minLifetimePoints;
    private final BigDecimal earnMultiplier;

    LoyaltyTier(int minLifetimePoints, BigDecimal earnMultiplier) {
        this.minLifetimePoints = minLifetimePoints;
        this.earnMultiplier = earnMultiplier;
    }

    public int getMinLifetimePoints() {
        return minLifetimePoints;
    }

    public BigDecimal getEarnMultiplier() {
        return earnMultiplier;
    }

    /** The tier a member with the given lifetime points belongs to. */
    public static LoyaltyTier fromLifetimePoints(int lifetimePoints) {
        LoyaltyTier tier = EXPLORER;
        for (LoyaltyTier candidate : values()) {
            if (lifetimePoints >= candidate.minLifetimePoints) {
                tier = candidate;
            }
        }
        return tier;
    }

    /** The next tier up, or null when already at the top. */
    public LoyaltyTier next() {
        int nextOrdinal = ordinal() + 1;
        return nextOrdinal < values().length ? values()[nextOrdinal] : null;
    }
}
