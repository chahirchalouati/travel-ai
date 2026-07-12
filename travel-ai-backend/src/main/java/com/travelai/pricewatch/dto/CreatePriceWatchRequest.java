package com.travelai.pricewatch.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** Request to watch a flight or cruise for price drops. Exactly one id is required. */
public record CreatePriceWatchRequest(
        UUID flightId,
        UUID cruiseId,
        BigDecimal targetPrice) {}
