package com.travelai.booking.dto;

import com.travelai.booking.BookingAncillary;

import java.math.BigDecimal;

/** A purchased add-on as returned on a booking. */
public record BookingAncillaryResponse(
        String code,
        String label,
        BigDecimal unitPrice,
        int quantity,
        String currency) {

    public static BookingAncillaryResponse from(BookingAncillary a) {
        return new BookingAncillaryResponse(
                a.getCode(), a.getLabel(), a.getUnitPrice(), a.getQuantity(), a.getCurrency());
    }
}
