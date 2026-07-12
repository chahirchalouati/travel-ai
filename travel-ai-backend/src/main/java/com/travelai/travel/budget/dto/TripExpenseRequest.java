package com.travelai.travel.budget.dto;

import com.travelai.travel.budget.TripExpenseCategory;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TripExpenseRequest(
        @NotNull TripExpenseCategory category,
        @Size(max = 255) String description,
        @NotNull @Positive BigDecimal amount,
        LocalDate spentOn
) {}
