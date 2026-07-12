package com.travelai.admin.catalog.dto;

import com.travelai.destination.Destination;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.util.UUID;

/** Admin create/update + view payloads for destinations. */
public final class AdminDestinationDto {

    private AdminDestinationDto() {
    }

    public record Upsert(
            @NotBlank String name,
            @NotBlank String country,
            String continent,
            String description,
            String imageUrl,
            String galleryUrls,
            String guideText,
            String topAttractions,
            String foodRecommendations,
            String travelTips,
            String tags,
            String climate,
            String bestMonths,
            BigDecimal avgDailyCost,
            String currency,
            String language,
            String timezone,
            BigDecimal latitude,
            BigDecimal longitude,
            int popularityScore,
            boolean featured,
            Boolean active
    ) {}

    public record View(
            UUID id,
            String name,
            String country,
            String continent,
            String description,
            String imageUrl,
            String galleryUrls,
            String guideText,
            String topAttractions,
            String foodRecommendations,
            String travelTips,
            String tags,
            String climate,
            String bestMonths,
            BigDecimal avgDailyCost,
            String currency,
            String language,
            String timezone,
            BigDecimal latitude,
            BigDecimal longitude,
            int popularityScore,
            boolean featured,
            boolean active
    ) {
        public static View from(Destination d) {
            return new View(
                    d.getId(), d.getName(), d.getCountry(), d.getContinent(), d.getDescription(),
                    d.getImageUrl(), d.getGalleryUrls(),
                    d.getGuideText(), d.getTopAttractions(), d.getFoodRecommendations(), d.getTravelTips(),
                    d.getTags(), d.getClimate(), d.getBestMonths(),
                    d.getAvgDailyCost(), d.getCurrency(), d.getLanguage(), d.getTimezone(),
                    d.getLatitude(), d.getLongitude(), d.getPopularityScore(), d.isFeatured(), d.isActive()
            );
        }
    }
}
