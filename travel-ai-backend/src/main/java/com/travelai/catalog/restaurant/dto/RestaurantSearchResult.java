package com.travelai.catalog.restaurant.dto;

import java.util.UUID;

public record RestaurantSearchResult(
        UUID id,
        String name,
        String cuisineType,
        Short priceTier,
        String city,
        String description,
        String imageUrl,
        boolean petFriendly,
        boolean accessible,
        boolean available,
        UUID partnerId
) {
}
