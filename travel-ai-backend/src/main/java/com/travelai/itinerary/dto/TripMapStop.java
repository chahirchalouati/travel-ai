package com.travelai.itinerary.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * One geolocated stop of a trip, ready to plot on the day-by-day map.
 * {@code day} is 1-based, relative to the booking check-in date.
 */
public record TripMapStop(
        UUID segmentId,
        int day,
        LocalDate date,
        String title,
        String type,
        BigDecimal lat,
        BigDecimal lng) {
}
