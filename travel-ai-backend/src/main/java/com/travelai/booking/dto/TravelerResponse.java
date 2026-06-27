package com.travelai.booking.dto;

import java.util.UUID;

public record TravelerResponse(
        UUID id,
        String firstName,
        String lastName,
        String documentNumber,
        boolean primary) {}
