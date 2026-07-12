package com.travelai.ai.concierge.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ConciergeRecommendation(
    UUID bookingId,
    String destination,
    LocalDate checkIn,
    LocalDate checkOut,
    String aiSuggestion,
    String weatherAdvice,
    String packingTips
) {}
