package com.travelai.catalog.hotel.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record HotelSearchResult(
        UUID id,
        String name,
        Short stars,
        String city,
        String description,
        String imageUrl,
        BigDecimal pricePerNight,
        BigDecimal totalPrice,
        boolean petFriendly,
        boolean accessible,
        boolean familyFriendly,
        boolean seaProximity,
        boolean available,
        UUID partnerId
) {
}
