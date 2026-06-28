package com.travelai.catalog.flight;

import org.springframework.data.jpa.repository.JpaRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface FlightRepository extends JpaRepository<Flight, UUID> {

    List<Flight> findByActiveTrueAndOriginIataAndDestIataAndDepartureAtBetweenAndSeatsAvailableGreaterThan(
            String origin, String dest, Instant from, Instant to, short minSeats);

    List<Flight> findByActiveTrueAndDestIataAndDepartureAtBetweenAndPriceLessThanEqual(
            String dest, Instant from, Instant to, BigDecimal maxPrice);

    List<Flight> findByActiveTrueAndDepartureAtBetweenAndSeatsAvailableGreaterThan(
            Instant from, Instant to, short minSeats);
}
