package com.travelai.press.dto;

import java.util.UUID;

public record PressCoverageResponse(
        UUID id,
        String outlet,
        String headline,
        String url,
        String icon,
        String dateLabel
) {}
