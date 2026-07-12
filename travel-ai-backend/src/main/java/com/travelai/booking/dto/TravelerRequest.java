package com.travelai.booking.dto;

import jakarta.validation.constraints.NotBlank;

public record TravelerRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        String documentNumber,
        boolean primary) {}
