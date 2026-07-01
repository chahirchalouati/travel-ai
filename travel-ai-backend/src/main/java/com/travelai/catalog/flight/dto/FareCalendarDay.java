package com.travelai.catalog.flight.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Cheapest available fare on a given departure day for a route. */
public record FareCalendarDay(LocalDate date, BigDecimal minPrice, int flightCount) {}
