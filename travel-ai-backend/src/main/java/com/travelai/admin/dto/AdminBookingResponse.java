package com.travelai.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminBookingResponse(
    UUID id,
    UUID userId,
    String status,
    BigDecimal totalAmount,
    Instant createdAt
) {}
