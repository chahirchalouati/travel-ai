package com.travelai.stories.dto;

import java.util.UUID;

public record TravelStoryResponse(
        UUID id,
        String place,
        String country,
        String tag,
        int minutes,
        String posterUrl,
        String videoUrl,
        boolean featured
) {}
