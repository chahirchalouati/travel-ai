package com.travelai.subscription.dto;

import com.travelai.subscription.UserSubscription;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Admin view of a Prime membership row (see {@link UserSubscription}). */
public record AdminSubscriptionResponse(
        UUID id,
        String userEmail,
        String planCode,
        String planName,
        String status,
        BigDecimal pricePaid,
        String currency,
        Instant startedAt,
        Instant renewsAt,
        Instant cancelledAt,
        Instant createdAt) {

    public static AdminSubscriptionResponse from(UserSubscription s, String planName) {
        return new AdminSubscriptionResponse(
                s.getId(),
                s.getUser() != null ? s.getUser().getEmail() : null,
                s.getPlanCode(),
                planName,
                s.getStatus() != null ? s.getStatus().name() : null,
                s.getPricePaid(),
                s.getCurrency(),
                s.getStartedAt(),
                s.getRenewsAt(),
                s.getCancelledAt(),
                s.getCreatedAt());
    }
}
