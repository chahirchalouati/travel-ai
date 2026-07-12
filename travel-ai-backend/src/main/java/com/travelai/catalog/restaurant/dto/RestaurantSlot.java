package com.travelai.catalog.restaurant.dto;

import java.time.LocalTime;

/** A bookable reservation slot for a restaurant on a given date. */
public record RestaurantSlot(LocalTime timeSlot, short coversAvailable) {}
