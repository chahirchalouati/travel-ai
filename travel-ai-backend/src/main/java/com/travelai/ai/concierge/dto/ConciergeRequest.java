package com.travelai.ai.concierge.dto;

import java.util.UUID;

public record ConciergeRequest(UUID bookingId, String userPreferences) {}
