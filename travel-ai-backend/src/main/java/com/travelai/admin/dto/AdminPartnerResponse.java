package com.travelai.admin.dto;

import java.time.Instant;
import java.util.UUID;

public record AdminPartnerResponse(
    UUID id,
    String name,
    String type,
    String city,
    String status,
    String contactEmail,
    boolean active,
    Instant createdAt
) {}
