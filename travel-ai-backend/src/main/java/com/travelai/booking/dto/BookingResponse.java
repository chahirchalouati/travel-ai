package com.travelai.booking.dto;

import com.travelai.booking.BookingStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record BookingResponse(
        UUID id,
        UUID proposalId,
        UUID hotelId,
        UUID restaurantId,
        UUID flightId,
        UUID cruiseId,
        String destination,
        BookingStatus status,
        BigDecimal totalAmount,
        BigDecimal hotelAmount,
        BigDecimal restaurantAmount,
        BigDecimal flightAmount,
        BigDecimal cruiseAmount,
        String fareClass,
        String timeSlot,
        String cabinCategory,
        Integer partySize,
        UUID tripGroupId,
        String bookingReference,
        LocalDate checkIn,
        LocalDate checkOut,
        List<TravelerResponse> travelers,
        BigDecimal refundAmount,
        Instant createdAt) {}
