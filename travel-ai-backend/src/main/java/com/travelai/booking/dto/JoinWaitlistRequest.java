package com.travelai.booking.dto;

import java.util.UUID;

public record JoinWaitlistRequest(UUID hotelId, UUID restaurantId, UUID flightId) {}
