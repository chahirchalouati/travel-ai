package com.travelai.payment.dto;

import com.travelai.payment.PaymentGateway;
import com.travelai.payment.PaymentType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record InitiatePaymentRequest(
        @NotNull UUID bookingId,
        @NotNull @DecimalMin("0.01") BigDecimal amount,
        @NotNull PaymentGateway gateway,
        @NotNull PaymentType type,
        String currency
) {}
