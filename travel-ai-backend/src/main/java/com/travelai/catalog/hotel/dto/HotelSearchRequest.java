package com.travelai.catalog.hotel.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record HotelSearchRequest(
        String city,
        LocalDate checkIn,
        LocalDate checkOut,
        int guests,
        BigDecimal maxBudget,
        List<String> constraints,
        Short minStars
) {
}
