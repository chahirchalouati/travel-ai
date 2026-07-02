package com.travelai.ancillary.dto;

import com.travelai.ancillary.AncillaryOption;

import java.math.BigDecimal;

/** A purchasable add-on offered to the client at checkout. */
public record AncillaryOptionResponse(
        String code,
        String label,
        String description,
        String vertical,
        BigDecimal price,
        String currency) {

    public static AncillaryOptionResponse from(AncillaryOption o) {
        return new AncillaryOptionResponse(
                o.getCode(), o.getLabel(), o.getDescription(),
                o.getVertical(), o.getPrice(), o.getCurrency());
    }
}
