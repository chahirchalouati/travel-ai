package com.travelai.catalog.flight.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FlightSearchResult(
        UUID id,
        String airline,
        String flightNumber,
        String originIata,
        String destIata,
        Instant departureAt,
        Instant arrivalAt,
        BigDecimal price,
        short seatsAvailable,
        boolean baggageIncluded
) {
}
