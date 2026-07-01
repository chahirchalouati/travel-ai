package com.travelai.booking.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Booking request. Supports both AI-proposal trips (hotel-centric) and standalone
 * single-vertical bookings (flight, restaurant or cruise) produced by the booking
 * funnel. Only {@code destination}, {@code totalAmount} and {@code travelers} are
 * always required; the rest depend on the vertical being booked.
 */
public record CreateBookingRequest(
        UUID proposalId,
        UUID hotelId,
        UUID restaurantId,
        UUID flightId,
        UUID cruiseId,
        @NotNull String destination,
        LocalDate checkIn,
        LocalDate checkOut,
        @NotNull BigDecimal totalAmount,
        BigDecimal hotelAmount,
        BigDecimal restaurantAmount,
        BigDecimal flightAmount,
        BigDecimal cruiseAmount,
        String fareClass,
        String timeSlot,
        String cabinCategory,
        Integer partySize,
        UUID tripGroupId,
        @NotNull List<TravelerRequest> travelers) {}
