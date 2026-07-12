package com.travelai.booking.dto;

import com.travelai.ancillary.dto.AncillarySelection;
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
        /** Gross booking base (unit price × party) the Prime member discount is computed on; used server-side to re-derive the entitled discount. */
        BigDecimal subtotal,
        /** Prime member discount the client applied and already subtracted from totalAmount; validated server-side against the caller's active membership. */
        BigDecimal memberDiscountAmount,
        /** Loyalty reward (voucher) the caller is applying to this booking; its discount is validated server-side and the reward marked used. */
        UUID rewardId,
        /** Voucher discount the client applied and already subtracted from totalAmount; validated server-side against the reward's snapshotted value. */
        BigDecimal rewardDiscountAmount,
        /** Loyalty points to spend on this booking; their discount is already reflected in totalAmount. */
        Integer redeemPoints,
        /** Optional paid add-ons; priced server-side and already reflected in totalAmount. */
        List<AncillarySelection> ancillaries,
        @NotNull List<TravelerRequest> travelers) {}
