package com.travelai.loyalty.dto;

import java.math.BigDecimal;

/**
 * Redemption preview: the most points the member may spend on this booking and
 * the EUR discount the requested (or maximum) points are worth.
 */
public record RedeemPreviewResponse(
        int maxRedeemablePoints,
        BigDecimal discountAmount) {}
