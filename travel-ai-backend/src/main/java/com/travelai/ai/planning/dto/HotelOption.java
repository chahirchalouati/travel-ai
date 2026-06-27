package com.travelai.ai.planning.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record HotelOption(
        UUID hotelId,
        String name,
        String city,
        BigDecimal pricePerNight,
        BigDecimal totalCost,
        double rating
) {
}
