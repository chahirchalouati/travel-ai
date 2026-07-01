package com.travelai.promo.dto;

import java.math.BigDecimal;

public record PromoValidationResponse(
        boolean valid,
        String code,
        BigDecimal discountAmount,
        BigDecimal finalAmount,
        String message) {}
