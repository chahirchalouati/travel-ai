package com.travelai.ai.planning.dto;

import com.travelai.shared.domain.SpendingPriority;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record AgentContext(
        UUID requestId,
        String destination,
        LocalDate departureDate,
        LocalDate returnDate,
        int adultsCount,
        int childrenCount,
        BigDecimal budget,
        BigDecimal hotelBudget,
        BigDecimal restaurantBudget,
        BigDecimal flightBudget,
        SpendingPriority spendingPriority,
        List<String> constraints
) {
}
