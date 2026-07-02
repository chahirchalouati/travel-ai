package com.travelai.loyalty.dto;

import com.travelai.loyalty.LoyaltyTransaction;

import java.time.Instant;
import java.util.UUID;

public record LoyaltyTransactionResponse(
        UUID id,
        String type,
        int points,
        UUID bookingId,
        String description,
        Instant createdAt) {

    public static LoyaltyTransactionResponse from(LoyaltyTransaction tx) {
        return new LoyaltyTransactionResponse(
                tx.getId(),
                tx.getType().name(),
                tx.getPoints(),
                tx.getBookingId(),
                tx.getDescription(),
                tx.getCreatedAt());
    }
}
