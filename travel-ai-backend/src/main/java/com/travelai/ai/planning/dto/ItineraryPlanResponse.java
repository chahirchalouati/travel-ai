package com.travelai.ai.planning.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * A structured, day-by-day trip itinerary. Every item carries the real catalogue
 * id and price, so the frontend can turn the plan straight into bookable cart
 * items — nothing here is a hallucinated place.
 */
public record ItineraryPlanResponse(
        String destination,
        int days,
        int nights,
        int party,
        PlannedHotel hotel,
        PlannedFlight flight,
        List<PlannedDay> plan,
        BigDecimal estimatedTotal,
        String currency,
        String summary) {

    public record PlannedHotel(
            UUID hotelId, String name, String city,
            BigDecimal pricePerNight, BigDecimal totalCost, double rating) {
    }

    public record PlannedFlight(
            UUID flightId, String airline, String origin, String destination,
            String departure, String arrival, BigDecimal price) {
    }

    public record PlannedDay(
            int day, String title, String narrative,
            List<PlannedActivity> activities, PlannedRestaurant dinner) {
    }

    public record PlannedActivity(
            UUID attractionId, String name, String category, BigDecimal price, boolean bookable) {
    }

    public record PlannedRestaurant(
            UUID restaurantId, String name, String cuisine, BigDecimal costPerPerson, double rating) {
    }
}
