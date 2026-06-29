package com.travelai.admin.catalog.dto;

import com.travelai.attraction.Attraction;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.UUID;

/** Admin create/update + view payloads for attractions / things-to-do. */
public final class AdminAttractionDto {

    private AdminAttractionDto() {
    }

    public record Upsert(
            @NotBlank String name,
            @NotBlank String category,
            @NotBlank String city,
            String country,
            String description,
            String imageUrl,
            BigDecimal latitude,
            BigDecimal longitude,
            String priceLevel,
            BigDecimal basePrice,
            Integer durationMinutes,
            boolean bookable,
            String tags,
            int popularityScore,
            boolean featured,
            Boolean active
    ) {}

    public record View(
            UUID id,
            String name,
            String category,
            String city,
            String country,
            String description,
            String imageUrl,
            BigDecimal latitude,
            BigDecimal longitude,
            String priceLevel,
            BigDecimal basePrice,
            Integer durationMinutes,
            boolean bookable,
            String tags,
            int popularityScore,
            boolean featured,
            boolean active
    ) {
        public static View from(Attraction a) {
            return new View(
                    a.getId(), a.getName(), a.getCategory(), a.getCity(), a.getCountry(),
                    a.getDescription(), a.getImageUrl(), a.getLatitude(), a.getLongitude(),
                    a.getPriceLevel(), a.getBasePrice(), a.getDurationMinutes(), a.isBookable(),
                    a.getTags(), a.getPopularityScore(), a.isFeatured(), a.isActive()
            );
        }
    }
}
