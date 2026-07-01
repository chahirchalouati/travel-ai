package com.travelai.notification.events;

import java.math.BigDecimal;
import java.util.UUID;

/** Published when a watched flight/cruise drops in price. */
public record PriceDropEvent(
        UUID priceWatchId,
        UUID userId,
        String userEmail,
        String label,
        BigDecimal oldPrice,
        BigDecimal newPrice) {}
