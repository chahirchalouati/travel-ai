package com.travelai.catalog.cruise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CruiseSearchResult(
        UUID id,
        String operator,
        String name,
        String shipName,
        String departurePort,
        String arrivalPort,
        LocalDate departureDate,
        LocalDate returnDate,
        int durationNights,
        BigDecimal pricePerPerson,
        int cabinsAvailable,
        String cruiseType,
        String description,
        String imageUrl,
        String itinerary,
        boolean allInclusive
) {
}
