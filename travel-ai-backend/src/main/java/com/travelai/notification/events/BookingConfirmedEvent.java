package com.travelai.notification.events;

import java.math.BigDecimal;
import java.util.UUID;

/** Published by the booking module when a booking is confirmed. */
public record BookingConfirmedEvent(
        UUID bookingId,
        UUID userId,
        String userEmail,
        String userName,
        String destination,
        BigDecimal totalAmount,
        String hotelName) {}
