package com.travelai.promo.dto;

import java.math.BigDecimal;

public record ValidatePromoRequest(String code, BigDecimal amount) {}
