package com.travelai.pricewatch.dto;

import com.travelai.pricewatch.PriceWatch;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PriceWatchResponse(
        UUID id,
        UUID flightId,
        UUID cruiseId,
        String label,
        BigDecimal lastPrice,
        BigDecimal targetPrice,
        boolean active,
        Instant createdAt) {

    public static PriceWatchResponse from(PriceWatch w) {
        return new PriceWatchResponse(
                w.getId(),
                w.getFlightId(),
                w.getCruiseId(),
                w.getLabel(),
                w.getLastPrice(),
                w.getTargetPrice(),
                w.isActive(),
                w.getCreatedAt());
    }
}
