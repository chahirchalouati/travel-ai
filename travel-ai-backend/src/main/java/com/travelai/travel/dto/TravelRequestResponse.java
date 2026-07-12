package com.travelai.travel.dto;

import com.travelai.shared.domain.SpendingPriority;
import com.travelai.travel.DateMode;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TravelRequestResponse(
        UUID id,
        String destination,
        LocalDate departureDate,
        LocalDate returnDate,
        DateMode dateMode,
        int adultsCount,
        Integer childrenCount,
        BigDecimal budget,
        SpendingPriority spendingPriority,
        List<String> constraints,
        Instant createdAt
) {
}
