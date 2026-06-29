package com.travelai.admin.catalog.dto;

import com.travelai.catalog.flight.Flight;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Admin create/update + view payloads for flights. */
public final class AdminFlightDto {

    private AdminFlightDto() {
    }

    public record Upsert(
            String airline,
            String flightNumber,
            String originIata,
            String destIata,
            Instant departureAt,
            Instant arrivalAt,
            BigDecimal price,
            Short seatsAvailable,
            boolean baggageIncluded,
            Boolean active
    ) {}

    public record View(
            UUID id,
            String airline,
            String flightNumber,
            String originIata,
            String destIata,
            Instant departureAt,
            Instant arrivalAt,
            BigDecimal price,
            short seatsAvailable,
            boolean baggageIncluded,
            boolean active
    ) {
        public static View from(Flight f) {
            return new View(
                    f.getId(), f.getAirline(), f.getFlightNumber(),
                    f.getOriginIata(), f.getDestIata(),
                    f.getDepartureAt(), f.getArrivalAt(),
                    f.getPrice(), f.getSeatsAvailable(), f.isBaggageIncluded(), f.isActive()
            );
        }
    }
}
