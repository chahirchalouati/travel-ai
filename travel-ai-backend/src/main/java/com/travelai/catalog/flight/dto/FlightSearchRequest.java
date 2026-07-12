package com.travelai.catalog.flight.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record FlightSearchRequest(
        String originIata,
        String destIata,
        LocalDate departureDate,
        int passengers,
        BigDecimal maxPrice
) {
}
