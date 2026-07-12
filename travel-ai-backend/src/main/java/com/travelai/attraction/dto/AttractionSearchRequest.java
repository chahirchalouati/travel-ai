package com.travelai.attraction.dto;

/**
 * Filters for the attractions listing. All fields optional — a fully empty
 * request returns active attractions ranked by popularity (browse mode).
 */
public record AttractionSearchRequest(
        String city,
        String category,
        String priceLevel,
        Boolean bookable
) {
}
