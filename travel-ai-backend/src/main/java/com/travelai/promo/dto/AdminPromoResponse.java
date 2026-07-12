package com.travelai.promo.dto;

import com.travelai.promo.PromoCode;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record AdminPromoResponse(
        UUID id,
        String code,
        String discountType,
        BigDecimal value,
        boolean active,
        Instant expiresAt,
        Integer maxRedemptions,
        int timesRedeemed,
        Instant createdAt) {

    public static AdminPromoResponse from(PromoCode p) {
        return new AdminPromoResponse(
                p.getId(),
                p.getCode(),
                p.getDiscountType().name(),
                p.getValue(),
                p.isActive(),
                p.getExpiresAt(),
                p.getMaxRedemptions(),
                p.getTimesRedeemed(),
                p.getCreatedAt());
    }
}
