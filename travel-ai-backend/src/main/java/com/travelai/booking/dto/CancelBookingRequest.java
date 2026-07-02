package com.travelai.booking.dto;

import jakarta.validation.constraints.Size;

/** Optional free-text reason attached to a self-service cancellation. */
public record CancelBookingRequest(
        @Size(max = 500) String reason) {}
