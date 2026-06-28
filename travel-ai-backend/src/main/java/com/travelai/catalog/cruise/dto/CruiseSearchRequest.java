package com.travelai.catalog.cruise.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CruiseSearchRequest(
        String departurePort,
        String cruiseType,
        LocalDate departureDate,
        int passengers,
        BigDecimal maxPrice
) {
}
