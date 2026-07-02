package com.travelai.ancillary.dto;

import java.math.BigDecimal;

/**
 * An ancillary selection resolved against the server-authoritative catalogue:
 * the code and quantity from the client, priced with the catalogue's unit price.
 */
public record ResolvedAncillary(
        String code,
        String label,
        BigDecimal unitPrice,
        int quantity,
        String currency) {

    public BigDecimal lineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
