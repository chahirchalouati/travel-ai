package com.travelai.user.dto;

import com.travelai.user.UserPlace;

import java.time.LocalDate;
import java.util.UUID;

public record PlaceResponse(
        UUID id,
        String name,
        String country,
        Double latitude,
        Double longitude,
        String note,
        LocalDate visitedOn
) {
    public static PlaceResponse from(UserPlace p) {
        return new PlaceResponse(p.getId(), p.getName(), p.getCountry(),
                p.getLatitude(), p.getLongitude(), p.getNote(), p.getVisitedOn());
    }
}
