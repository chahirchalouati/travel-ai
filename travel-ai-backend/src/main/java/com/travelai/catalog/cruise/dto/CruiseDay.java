package com.travelai.catalog.cruise.dto;

/** One day of a cruise's day-by-day itinerary. */
public record CruiseDay(int dayNumber, String port, String description) {}
