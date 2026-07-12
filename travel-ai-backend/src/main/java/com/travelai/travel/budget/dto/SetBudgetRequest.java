package com.travelai.travel.budget.dto;

import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/** Body of PUT /trips/{id}/budget. A null amount clears the budget. */
public record SetBudgetRequest(@Positive BigDecimal amount) {}
