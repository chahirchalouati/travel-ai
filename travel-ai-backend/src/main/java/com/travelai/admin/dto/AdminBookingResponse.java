package com.travelai.admin.dto;

import com.travelai.booking.Booking;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminBookingResponse(
    UUID id,
    UUID userId,
    String userEmail,
    String destination,
    String bookingReference,
    String status,
    BigDecimal totalAmount,
    Instant createdAt
) {
    public static AdminBookingResponse from(Booking b) {
        return new AdminBookingResponse(
            b.getId(),
            b.getUser() != null ? b.getUser().getId() : null,
            b.getUser() != null ? b.getUser().getEmail() : null,
            b.getDestination(),
            b.getBookingReference(),
            b.getStatus() != null ? b.getStatus().name() : null,
            b.getTotalAmount(),
            b.getCreatedAt()
        );
    }
}
