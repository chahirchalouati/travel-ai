package com.travelai.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record PlaceRequest(
        @NotBlank @Size(max = 160) String name,
        @Size(max = 120) String country,
        Double latitude,
        Double longitude,
        @Size(max = 500) String note,
        LocalDate visitedOn
) {}
