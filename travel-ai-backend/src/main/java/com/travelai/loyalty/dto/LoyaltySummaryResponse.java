package com.travelai.loyalty.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Snapshot of a member's loyalty standing. {@code nextTier} and
 * {@code pointsToNextTier} are null once the top tier is reached.
 */
public record LoyaltySummaryResponse(
        int pointsBalance,
        int lifetimePoints,
        String tier,
        String nextTier,
        Integer pointsToNextTier,
        BigDecimal earnRate,
        List<LoyaltyTransactionResponse> recentTransactions) {}
