package com.travelai.travel.dto;

import com.travelai.shared.domain.SpendingPriority;
import com.travelai.travel.DateMode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record CreateTravelRequestRequest(
        String destination,
        @NotNull LocalDate departureDate,
        @NotNull LocalDate returnDate,
        @NotNull DateMode dateMode,
        @NotNull @Min(1) Integer adultsCount,
        Integer childrenCount,
        @NotNull @DecimalMin("0.01") BigDecimal budget,
        @NotNull SpendingPriority spendingPriority,
        List<String> constraints
) {
}
