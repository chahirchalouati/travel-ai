package com.travelai.catalog.restaurant.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public record RestaurantSearchRequest(
        String city,
        LocalDate date,
        LocalTime preferredTime,
        int covers,
        BigDecimal maxBudgetPerPerson,
        String cuisineType
) {
}
