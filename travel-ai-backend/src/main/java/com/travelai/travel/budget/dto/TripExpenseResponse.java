package com.travelai.travel.budget.dto;

import com.travelai.travel.budget.TripExpense;
import com.travelai.travel.budget.TripExpenseCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TripExpenseResponse(
        UUID id,
        TripExpenseCategory category,
        String description,
        BigDecimal amount,
        LocalDate spentOn,
        Instant createdAt
) {
    public static TripExpenseResponse from(TripExpense e) {
        return new TripExpenseResponse(
                e.getId(), e.getCategory(), e.getDescription(), e.getAmount(), e.getSpentOn(), e.getCreatedAt());
    }
}
