package com.travelai.admin.dto;

import java.util.List;
import java.util.UUID;

/** Grouped results for the global admin search box. */
public record AdminSearchResponse(
        List<Hit> users,
        List<Hit> bookings,
        List<Hit> partners) {

    /** A single search hit: id + primary label + secondary detail. */
    public record Hit(UUID id, String primary, String secondary) {}
}
