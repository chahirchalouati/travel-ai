package com.travelai.travel.budget.dto;

import java.util.UUID;

/** Minimal pointer from a booking to the trip (travel request) it belongs to. */
public record TripRefResponse(UUID tripId, String destination) {}
