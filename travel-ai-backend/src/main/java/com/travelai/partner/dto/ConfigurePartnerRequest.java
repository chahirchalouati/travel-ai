package com.travelai.partner.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;

public record ConfigurePartnerRequest(
        String address,
        @NotBlank String city,
        String country,
        BigDecimal latitude,
        BigDecimal longitude,
        String contactPhone
) {}
