package com.travelai.promo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminPromoUpsertRequest(
        @NotBlank String code,
        @NotNull String discountType,
        @NotNull @Positive BigDecimal value,
        Boolean active,
        Instant expiresAt,
        Integer maxRedemptions) {
}
