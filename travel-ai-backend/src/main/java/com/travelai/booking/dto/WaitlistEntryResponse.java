package com.travelai.booking.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record WaitlistEntryResponse(
        UUID id,
        UUID hotelId,
        UUID restaurantId,
        UUID flightId,
        LocalDateTime requestedAt,
        boolean notified) {}
