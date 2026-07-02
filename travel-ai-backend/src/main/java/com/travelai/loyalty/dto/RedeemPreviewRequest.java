package com.travelai.loyalty.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/** Ask how many points can be redeemed against a booking total ({@code points} optional). */
public record RedeemPreviewRequest(
        @NotNull BigDecimal amount,
        Integer points) {}
