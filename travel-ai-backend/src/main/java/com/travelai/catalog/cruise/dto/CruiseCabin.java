package com.travelai.catalog.cruise.dto;

import java.math.BigDecimal;

/**
 * A bookable cabin tier. {@code price} is the resolved per-person price
 * (cruise base × multiplier); {@code priceMultiplier} is exposed so the funnel
 * can drive its option pricing consistently.
 */
public record CruiseCabin(
        String name,
        String description,
        BigDecimal priceMultiplier,
        BigDecimal price,
        int cabinsAvailable) {}
