package com.travelai.itinerary.dto;

import java.util.List;

/**
 * Ordered, geolocated stops of a trip plus the count of segments that could
 * not be resolved to coordinates (and are therefore not in {@code stops}).
 */
public record TripMapResponse(List<TripMapStop> stops, int missingCoords) {
}
