package com.travelai.ancillary.dto;

/**
 * A client's request to add an ancillary option to a booking. Only the code and
 * quantity are trusted; the price is resolved server-side from the catalogue.
 */
public record AncillarySelection(String code, Integer quantity) {}
