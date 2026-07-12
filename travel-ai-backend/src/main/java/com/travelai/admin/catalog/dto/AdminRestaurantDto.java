package com.travelai.admin.catalog.dto;

import com.travelai.catalog.restaurant.Restaurant;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/** Admin create/update + view payloads for restaurants. */
public final class AdminRestaurantDto {

    private AdminRestaurantDto() {
    }

    public record Upsert(
            @NotNull UUID partnerId,
            @NotBlank String name,
            String cuisineType,
            Short priceTier,
            String description,
            String city,
            BigDecimal latitude,
            BigDecimal longitude,
            boolean petFriendly,
            boolean accessible,
            String imageUrl,
            Boolean active
    ) {}

    public record View(
            UUID id,
            UUID partnerId,
            String partnerName,
            String name,
            String cuisineType,
            Short priceTier,
            String description,
            String city,
            BigDecimal latitude,
            BigDecimal longitude,
            boolean petFriendly,
            boolean accessible,
            String imageUrl,
            boolean active
    ) {
        public static View from(Restaurant r) {
            return new View(
                    r.getId(),
                    r.getPartner() != null ? r.getPartner().getId() : null,
                    r.getPartner() != null ? r.getPartner().getName() : null,
                    r.getName(), r.getCuisineType(), r.getPriceTier(), r.getDescription(),
                    r.getCity(), r.getLatitude(), r.getLongitude(),
                    r.isPetFriendly(), r.isAccessible(), r.getImageUrl(), r.isActive()
            );
        }
    }
}
