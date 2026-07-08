package com.travelai.careers.dto;

import java.util.UUID;

public record JobPositionResponse(
        UUID id,
        String title,
        String department,
        String location,
        String employmentType,
        String applyEmail
) {}
