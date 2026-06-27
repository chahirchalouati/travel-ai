package com.travelai.booking.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateBookingRequest(
        @NotNull UUID proposalId,
        @NotNull UUID hotelId,
        UUID restaurantId,
        UUID flightId,
        @NotNull String destination,
        @NotNull LocalDate checkIn,
        @NotNull LocalDate checkOut,
        @NotNull BigDecimal totalAmount,
        BigDecimal hotelAmount,
        BigDecimal restaurantAmount,
        BigDecimal flightAmount,
        @NotNull List<TravelerRequest> travelers) {}
