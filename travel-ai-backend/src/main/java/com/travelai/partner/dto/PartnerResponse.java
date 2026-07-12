package com.travelai.partner.dto;

import com.travelai.partner.PartnerStatus;
import com.travelai.partner.PartnerType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PartnerResponse(
        UUID id,
        PartnerType type,
        String name,
        String vatNumber,
        String contactEmail,
        String contactPhone,
        String address,
        String city,
        String country,
        BigDecimal latitude,
        BigDecimal longitude,
        PartnerStatus status,
        BigDecimal qualityScore,
        boolean active,
        Instant createdAt
) {}
