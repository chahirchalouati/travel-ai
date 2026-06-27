package com.travelai.travel.events;

import com.travelai.shared.domain.SpendingPriority;

import java.math.BigDecimal;
import java.util.UUID;

public record TravelRequestCreatedEvent(
        UUID requestId,
        String userEmail,
        BigDecimal budget,
        SpendingPriority spendingPriority,
        String destination
) {
}
