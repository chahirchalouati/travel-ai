package com.travelai.attraction.dto;

import com.travelai.attraction.Attraction;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record AttractionResponse(
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
        List<String> tags,
        int popularityScore,
        boolean featured
) {
    public static AttractionResponse from(Attraction a) {
        List<String> tagList = (a.getTags() == null || a.getTags().isBlank())
                ? List.of()
                : List.of(a.getTags().split("\\s*,\\s*"));
        return new AttractionResponse(
                a.getId(),
                a.getName(),
                a.getCategory(),
                a.getCity(),
                a.getCountry(),
                a.getDescription(),
                a.getImageUrl(),
                a.getLatitude(),
                a.getLongitude(),
                a.getPriceLevel(),
                a.getBasePrice(),
                a.getDurationMinutes(),
                a.isBookable(),
                tagList,
                a.getPopularityScore(),
                a.isFeatured()
        );
    }
}
