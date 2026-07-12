package com.travelai.partner.dto;

import com.travelai.partner.PartnerStatus;
import com.travelai.partner.PartnerType;

import java.util.UUID;

public record PartnerSummaryResponse(
        UUID id,
        String name,
        PartnerType type,
        String city,
        PartnerStatus status,
        boolean active
) {}
