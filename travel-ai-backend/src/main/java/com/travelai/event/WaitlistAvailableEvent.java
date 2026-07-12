package com.travelai.event;

import java.time.LocalDate;
import java.util.UUID;

/** Published when a waitlisted hotel becomes available. */
public record WaitlistAvailableEvent(
        UUID waitlistEntryId,
        UUID userId,
        String userEmail,
        String hotelName,
        LocalDate dateFrom,
        LocalDate dateTo) {}
