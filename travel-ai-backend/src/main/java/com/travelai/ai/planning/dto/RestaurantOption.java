package com.travelai.ai.planning.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RestaurantOption(
        UUID restaurantId,
        String name,
        String city,
        String cuisine,
        BigDecimal estimatedCostPerPerson,
        double rating
) {
}
