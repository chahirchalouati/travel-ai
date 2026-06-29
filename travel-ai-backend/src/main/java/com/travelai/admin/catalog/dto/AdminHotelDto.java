package com.travelai.admin.catalog.dto;

import com.travelai.catalog.hotel.Hotel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

/** Admin create/update + view payloads for hotels. */
public final class AdminHotelDto {

    private AdminHotelDto() {
    }

    public record Upsert(
            @NotNull UUID partnerId,
            @NotBlank String name,
            Short stars,
            String description,
            String city,
            BigDecimal latitude,
            BigDecimal longitude,
            boolean petFriendly,
            boolean accessible,
            boolean familyFriendly,
            boolean seaProximity,
            String imageUrl,
            BigDecimal basePriceNight,
            Boolean active
    ) {}

    public record View(
            UUID id,
            UUID partnerId,
            String partnerName,
            String name,
            Short stars,
            String description,
            String city,
            BigDecimal latitude,
            BigDecimal longitude,
            boolean petFriendly,
            boolean accessible,
            boolean familyFriendly,
            boolean seaProximity,
            String imageUrl,
            BigDecimal basePriceNight,
            boolean active
    ) {
        public static View from(Hotel h) {
            return new View(
                    h.getId(),
                    h.getPartner() != null ? h.getPartner().getId() : null,
                    h.getPartner() != null ? h.getPartner().getName() : null,
                    h.getName(), h.getStars(), h.getDescription(), h.getCity(),
                    h.getLatitude(), h.getLongitude(),
                    h.isPetFriendly(), h.isAccessible(), h.isFamilyFriendly(), h.isSeaProximity(),
                    h.getImageUrl(), h.getBasePriceNight(), h.isActive()
            );
        }
    }
}
