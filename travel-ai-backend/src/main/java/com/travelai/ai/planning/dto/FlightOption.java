package com.travelai.ai.planning.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FlightOption(
        UUID flightId,
        String airline,
        String origin,
        String destination,
        Instant departure,
        Instant arrival,
        BigDecimal price,
        int availableSeats
) {
}
