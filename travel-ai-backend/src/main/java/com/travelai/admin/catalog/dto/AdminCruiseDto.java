package com.travelai.admin.catalog.dto;

import com.travelai.catalog.cruise.Cruise;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/** Admin create/update + view payloads for cruises. */
public final class AdminCruiseDto {

    private AdminCruiseDto() {
    }

    public record Upsert(
            @NotBlank String operator,
            @NotBlank String name,
            String shipName,
            @NotBlank String departurePort,
            String arrivalPort,
            LocalDate departureDate,
            LocalDate returnDate,
            int durationNights,
            BigDecimal pricePerPerson,
            int cabinsAvailable,
            String cruiseType,
            String description,
            String imageUrl,
            String itinerary,
            boolean allInclusive,
            Boolean active
    ) {}

    public record View(
            UUID id,
            String operator,
            String name,
            String shipName,
            String departurePort,
            String arrivalPort,
            LocalDate departureDate,
            LocalDate returnDate,
            int durationNights,
            BigDecimal pricePerPerson,
            int cabinsAvailable,
            String cruiseType,
            String description,
            String imageUrl,
            String itinerary,
            boolean allInclusive,
            boolean active
    ) {
        public static View from(Cruise c) {
            return new View(
                    c.getId(), c.getOperator(), c.getName(), c.getShipName(),
                    c.getDeparturePort(), c.getArrivalPort(),
                    c.getDepartureDate(), c.getReturnDate(), c.getDurationNights(),
                    c.getPricePerPerson(), c.getCabinsAvailable(), c.getCruiseType(),
                    c.getDescription(), c.getImageUrl(), c.getItinerary(),
                    c.isAllInclusive(), c.isActive()
            );
        }
    }
}
