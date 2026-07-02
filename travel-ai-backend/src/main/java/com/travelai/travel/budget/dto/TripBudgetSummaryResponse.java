package com.travelai.travel.budget.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * "How much is this trip costing vs my budget."
 * budget / remaining / percentUsed are null when no budget is set.
 */
public record TripBudgetSummaryResponse(
        BigDecimal budget,
        String currency,
        BigDecimal totalSpent,
        BigDecimal remaining,
        Double percentUsed,
        List<CategorySpend> breakdown
) {
    /** One slice of the spend: booking verticals (VOLI, HOTEL, …) or expense categories (FOOD, …). */
    public record CategorySpend(String category, BigDecimal amount, long count) {}
}
